const jwt = require("jsonwebtoken");
const { parse } = require("cookie");
const database = require("../../database");
const { isProduction, jwtSecret } = require("../../config");

const cookiePrefix = isProduction ? "__Host-" : "";

const roles = {
  merchant: { audience: "merchant-web", cookieName: `${cookiePrefix}merchant_session`, profileTable: "merchant_profiles" },
  rider: { audience: "rider-web", cookieName: `${cookiePrefix}rider_session`, profileTable: "rider_profiles" },
  customer: { audience: "customer-app", profileTable: "customer_profiles" },
};

function readToken(socket, role) {
  if (role === "customer") return socket.handshake.auth.token;
  return parse(socket.handshake.headers.cookie || "")[roles[role].cookieName];
}

function verifyToken(token, audience) {
  try {
    return jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
      issuer: "new-project-api",
      audience,
    });
  } catch {
    return null;
  }
}

async function signIn(socket) {
  const role = socket.handshake.auth.role;
  if (!roles[role]) return null;

  const payload = verifyToken(readToken(socket, role), roles[role].audience);
  if (!payload || payload.role !== role) return null;

  const [users] = await database.query(
    "SELECT status, token_version FROM users WHERE id = ? AND role = ? AND deleted_at IS NULL",
    [payload.id, role],
  );
  const user = users[0];
  if (!user || user.status === "suspended") return null;
  if (role !== "customer" && payload.tv !== Number(user.token_version)) return null;

  const notDeleted = role === "customer" ? " AND deleted_at IS NULL" : "";
  const [profiles] = await database.query(
    `SELECT id, operator_profiles_id FROM ${roles[role].profileTable} WHERE user_id = ?${notDeleted}`,
    [payload.id],
  );
  const profile = profiles[0];
  if (!profile) return null;

  return { role, profileId: profile.id, operatorId: profile.operator_profiles_id };
}

module.exports = { signIn };
