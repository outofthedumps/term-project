const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

function createLiveReload(publicDirectory) {
  const clients = new Set();
  const instance = randomUUID();

  let revision = 0;
  let pendingReload;
  let closed = false;

  // The instance changes when the server restarts.
  // The revision changes when a watched file is saved.
  const getVersion = () => `${instance}:${revision}`;

  function sendVersion(response) {
    response.write(
      `event: version\ndata: ${getVersion()}\n\n`
    );
  }

  function scheduleReload(eventType, filename) {
    if (closed) return;

    // Ignore temporary files created by editors.
    if (
      filename &&
      /(^|[/\\])\.|(?:~|\.swp|\.tmp)$/.test(String(filename))
    ) {
      return;
    }

    clearTimeout(pendingReload);

    pendingReload = setTimeout(() => {
      revision += 1;

      for (const response of clients) {
        sendVersion(response);
      }
    }, 150);
  }

  const watchers = ["views", "css", "images"].map((folder) => {
    const watcher = fs.watch(
      path.join(publicDirectory, folder),
      { recursive: true },
      scheduleReload
    );

    watcher.on("error", (error) => {
      console.error(
        `Automatic reload could not watch ${folder}: ${error.message}`
      );
    });

    return watcher;
  });

  const heartbeat = setInterval(() => {
    for (const response of clients) {
      response.write(": keep-alive\n\n");
    }
  }, 15000);

  heartbeat.unref();

  function attach(app) {
    app.get("/__dev/reload.js", (req, res) => {
      res.sendFile(
        path.join(__dirname, "reload-client.js"),
        {
          cacheControl: false,
          etag: false,
          lastModified: false,
        }
      );
    });

    app.get("/__dev/events", (req, res) => {
      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      res.flushHeaders();
      res.write("retry: 500\n\n");

      sendVersion(res);
      clients.add(res);

      res.on("close", () => {
        clients.delete(res);
      });
    });
  }

  function close() {
    if (closed) return;

    closed = true;

    clearTimeout(pendingReload);
    clearInterval(heartbeat);

    for (const watcher of watchers) {
      watcher.close();
    }

    for (const response of clients) {
      response.end();
    }

    clients.clear();
  }

  return { attach, getVersion, close };
}

module.exports = createLiveReload;