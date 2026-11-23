const express = require("express");
const path = require("node:path");
const pageRoutes = require("./routes/pageRoutes");

function createApp({ liveReload = null } = {}) {
  const app = express();
  const publicDirectory = path.resolve(__dirname, "../public");

  // Express renders the Pug source directly; no generated HTML files are needed.
  app.set("views", path.join(publicDirectory, "views"));
  app.set("view engine", "pug");
  app.locals.devReload = Boolean(liveReload);

  if (liveReload) {
    // Keep development updates working even if NODE_ENV was set to production.
    app.disable("view cache");
    app.use((req, res, next) => {
      res.set("Cache-Control", "no-store");
      res.locals.reloadVersion = liveReload.getVersion();
      next();
    });
    liveReload.attach(app);
  }

  // Only assets are public. Pug source and package files are not served.
  const assetOptions = liveReload
    ? { cacheControl: false, etag: false, lastModified: false }
    : {};
  app.use("/css", express.static(path.join(publicDirectory, "css"), assetOptions));
  app.use("/images", express.static(path.join(publicDirectory, "images"), assetOptions));
  app.use("/", pageRoutes);

  function sendErrorPage(res, status, title, message) {
    const reloadScript = liveReload
      ? `<script src="/__dev/reload.js" data-reload-version="${liveReload.getVersion()}" defer></script>`
      : "";
    res.status(status).type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8"><title>${title} | History Showroom</title></head>
  <body>
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="/">Return to the home page</a></p>
    ${reloadScript}
  </body>
</html>`);
  }

  app.use((req, res) => {
    sendErrorPage(res, 404, "Page not found", "That page does not exist.");
  });

  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);

    const message = liveReload
      ? "Check the terminal for the error. This page will reload after you save a fix."
      : "Please try again in a moment.";
    sendErrorPage(res, 500, "Unable to display this page", message);
  });

  return app;
}

module.exports = createApp;
