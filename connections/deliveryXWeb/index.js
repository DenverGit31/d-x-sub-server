const { signIn } = require("./signIn");
const { roomFor } = require("./rooms");
const { listenForOrderEvents } = require("./orderEvents");
const { listenForAddonEvents } = require("./addonEvents");

function isSameSite(socket) {
  const { origin, host } = socket.handshake.headers;
  return !origin || new URL(origin).host === host;
}

function connectDeliveryXWeb(io) {
  const namespace = io.of("/delivery-x-web");

  namespace.use(async (socket, next) => {
    try {
      if (!isSameSite(socket)) return next(new Error("forbidden"));
      const user = await signIn(socket);
      if (!user) return next(new Error("unauthorized"));
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  namespace.on("connection", (socket) => {
    const room = roomFor(socket.data.user);
    if (room) socket.join(room);
    listenForOrderEvents(namespace, socket);
    listenForAddonEvents(namespace, socket);
  });
}

module.exports = { connectDeliveryXWeb };
