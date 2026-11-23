const database = require("../../database");

const selectOrder =
  "SELECT merchant_profiles_id, operator_profiles_id," +
  " (SELECT status FROM order_statuses WHERE order_transactions_id = order_transactions.id ORDER BY id DESC LIMIT 1) AS status" +
  " FROM order_transactions WHERE order_code = ? AND ";

async function findOrder(whereOwner, orderCode, ownerId) {
  const [orders] = await database.query(selectOrder + whereOwner, [orderCode, ownerId]);
  return orders[0] || null;
}

const findCustomerOrder = (orderCode, customerId) => findOrder("customer_profiles_id = ?", orderCode, customerId);
const findMerchantOrder = (orderCode, merchantId) => findOrder("merchant_profiles_id = ?", orderCode, merchantId);

module.exports = { findCustomerOrder, findMerchantOrder };
