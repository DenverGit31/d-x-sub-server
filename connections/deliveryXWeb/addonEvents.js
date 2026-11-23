const { customerRoom } = require("./rooms");

const COALESCE_WINDOW_MILLISECONDS = 500;

// Operators with a customer notification already waiting to go out.
const pendingNotifications = new Map();

function notifyCustomersSoon(namespace, operatorId) {
  // A pending notification already covers this change: customers re-fetch after it fires.
  if (pendingNotifications.has(operatorId)) return;

  const timer = setTimeout(() => {
    pendingNotifications.delete(operatorId);
    namespace.to(customerRoom(operatorId)).emit("addons:changed");
  }, COALESCE_WINDOW_MILLISECONDS);
  pendingNotifications.set(operatorId, timer);
}

function listenForAddonEvents(namespace, socket) {
  const user = socket.data.user;

  // Operator changed add-ons: tell that operator's customers to re-check.
  socket.on("addons:changed", (reply) => {
    const isOperator = user.role === "operator";
    // The room comes from the signed-in profile, never from the client.
    if (isOperator) notifyCustomersSoon(namespace, user.profileId);
    // The client may send a non-function ack, which must not crash the server.
    if (typeof reply === "function") reply(isOperator);
  });
}

module.exports = { listenForAddonEvents };
