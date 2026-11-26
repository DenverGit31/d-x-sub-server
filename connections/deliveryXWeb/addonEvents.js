const { customerRoom, merchantsRoom, riderRoom } = require("./rooms");

const COALESCE_WINDOW_MILLISECONDS = 500;

// Operators with a notification already waiting to go out (to their customers, merchants and riders).
const pendingNotifications = new Map();

function notifyCustomersSoon(namespace, operatorId) {
  // A pending notification already covers this change: customers, merchants and riders re-fetch after it fires.
  if (pendingNotifications.has(operatorId)) return;

  const timer = setTimeout(() => {
    pendingNotifications.delete(operatorId);
    namespace.to(customerRoom(operatorId)).to(merchantsRoom(operatorId)).to(riderRoom(operatorId)).emit("addons:changed");
  }, COALESCE_WINDOW_MILLISECONDS);
  pendingNotifications.set(operatorId, timer);
}

function listenForAddonEvents(namespace, socket) {
  const user = socket.data.user;

  // Operator changed add-ons: tell that operator's customers, merchants and riders to re-check.
  socket.on("addons:changed", (reply) => {
    const isOperator = user.role === "operator";
    // The room comes from the signed-in profile, never from the client.
    if (isOperator) notifyCustomersSoon(namespace, user.profileId);
    // The client may send a non-function ack, which must not crash the server.
    if (typeof reply === "function") reply(isOperator);
  });
}

module.exports = { listenForAddonEvents };
