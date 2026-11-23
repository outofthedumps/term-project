const path = require("node:path")
const createApp = require("./app")
const createLiveReload = require("./dev/liveReload")


const isDevelopment = process.argv.includes("--dev");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

//test for valid port
if (!Number.isInteger(port) || port < 0 || port > 65536){
    throw new Error("PORT must be a whole number between 0 and 65535.")
}