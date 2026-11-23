const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const { port } = require("./config");
const database = require("./database");
const { connectDeliveryXWeb } = require("./connections/deliveryXWeb");

const app = express();
app.disable("x-powered-by");
app.get("/health", (_request, response) => response.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server);

connectDeliveryXWeb(io);

server.listen(port, () => console.log(`d-x-server running on port ${port}`));

function shutDown() {
  io.close(async () => {
    await database.end();
    process.exit(0);
  });
}

process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);
