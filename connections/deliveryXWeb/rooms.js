const merchantRoom = (merchantId) => `merchant:${merchantId}`;
const riderRoom = (operatorId) => `operator:${operatorId}`;
const customerRoom = (operatorId) => `customers:${operatorId}`;
// Every merchant of one operator (merchantRoom is one merchant only).
const merchantsRoom = (operatorId) => `merchants:${operatorId}`;

function roomFor(user) {
  if (user.role === "merchant") return merchantRoom(user.profileId);
  if (user.role === "rider") return riderRoom(user.operatorId);
  if (user.role === "customer") return customerRoom(user.operatorId);
  return null;
}

module.exports = { merchantRoom, riderRoom, customerRoom, merchantsRoom, roomFor };
