const path = require("node:path");
const createApp = require("./app");

const isDevelopment = process.argv.includes("--dev");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be a whole number between 0 and 65535.");
}

let liveReload = null;

if (isDevelopment) {
  const createLiveReload = require("./dev/liveReload");

  liveReload = createLiveReload(
    path.resolve(__dirname, "../public")
  );
}

const app = createApp({ liveReload });

const server = app.listen(port, host, (error) => {
  if (error) return;

  console.log(
    `History Showroom: http://${host}:${server.address().port}`
  );

  if (isDevelopment) {
    console.log(
      "Development mode: save Pug, CSS, or images to reload the browser."
    );
  }
});

server.on("error", (error) => {
  if (liveReload) liveReload.close();

  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Stop the other server or choose another PORT.`
      : error.message
  );

  process.exitCode = 1;
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;

  shuttingDown = true;

  if (liveReload) liveReload.close();

  server.close(() => process.exit(0));

  setTimeout(() => process.exit(0), 1500).unref();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);










