const { findCustomerOrder, findMerchantOrder } = require("./orderLookup");
const { merchantRoom, riderRoom } = require("./rooms");

function isOrderCode(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 64;
}

function listenForOrderEvents(namespace, socket) {
  const user = socket.data.user;

  // Customer placed an order: tell that order's merchant.
  socket.on("order:placed", async (orderCode, reply) => {
    try {
      const order = user.role === "customer" && isOrderCode(orderCode) && (await findCustomerOrder(orderCode, user.profileId));
      const isPlaced = Boolean(order) && order.status === "place";
      if (isPlaced) namespace.to(merchantRoom(order.merchant_profiles_id)).emit("order:new", orderCode);
      reply?.(isPlaced);
    } catch {
      reply?.(false);
    }
  });

  // Merchant marked an order ready: tell the riders of the same operator.
  socket.on("order:ready", async (orderCode, reply) => {
    try {
      const order = user.role === "merchant" && isOrderCode(orderCode) && (await findMerchantOrder(orderCode, user.profileId));
      const isReady = Boolean(order) && order.status === "mark_as_ready";
      if (isReady) namespace.to(riderRoom(order.operator_profiles_id)).emit("booking:ready", orderCode);
      reply?.(isReady);
    } catch {
      reply?.(false);
    }
  });
}

module.exports = { listenForOrderEvents };
