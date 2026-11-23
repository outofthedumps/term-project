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


const liveReload = isDevelopment
    ? createLiveReload(path.resolve(__dirname, "../public"))
    : null; 

const app = createApp({liveReload});

const server = app.listen(port, host, (error)=>{
    if(error) return; 
    console.log(`History Showroom: http://${host}:${server.address().port}`);
});


server.on("error", (error)=>{
    if(liveReload) liveReload.close(); 
    console.error(error.code === "EADDRINUSE"
        ? `Port ${port} is already in use. Stop the other server or choose anther PORT`
        : error.message); 
    process.exitCode = 1;
});


let suttingDown = false; 
function shutdown(){
    if(shuttingDown) return; 
    shuttingDown = true; 
    if(liveReload) liveReload.close();
    server.close(()=> process.exit(0));

    setTimeout(()=> process.exit(0), 1500).unref(); 
}

process.once("SIGINT", shutdown); 
process.once("SIGTERM", shutdown)
















