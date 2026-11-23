(() => {
  const pageVersion = document.currentScript.dataset.reloadVersion;

  let connection;
  let reloading = false;

  function connect() {
    connection = new EventSource("/__dev/events");

    connection.addEventListener("version", (event) => {
      if (event.data !== pageVersion && !reloading) {
        reloading = true;
        connection.close();
        window.location.reload();
      }
    });
  }

  connect();

  window.addEventListener("pagehide", () => {
    connection.close();
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      connect();
    }
  });
})();