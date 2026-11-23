const merchantRoom = (merchantId) => `merchant:${merchantId}`;
const riderRoom = (operatorId) => `operator:${operatorId}`;

function roomFor(user) {
  if (user.role === "merchant") return merchantRoom(user.profileId);
  if (user.role === "rider") return riderRoom(user.operatorId);
  return null;
}

module.exports = { merchantRoom, riderRoom, roomFor };
