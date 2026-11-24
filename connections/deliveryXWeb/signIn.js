const jwt = require("jsonwebtoken");
const { parse } = require("cookie");
const database = require("../../database");
const { isProduction, jwtSecret } = require("../../config");

const cookiePrefix = isProduction ? "__Host-" : "";

const roles = {
  merchant: { audience: "merchant-web", cookieName: `${cookiePrefix}merchant_session`, profileTable: "merchant_profiles" },
  rider: { audience: "rider-web", cookieName: `${cookiePrefix}rider_session`, profileTable: "rider_profiles" },
  customer: { audience: "customer-app", profileTable: "customer_profiles" },
  operator: { audience: "operator-dashboard", cookieName: `${cookiePrefix}token`, profileTable: "operator_profiles" },
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
  // Customer and operator tokens carry no tv claim.
  // The pf (password fingerprint) check is not repeated here on purpose: this socket can only ping the operator's own customers to re-check.
  const hasTokenVersion = role !== "customer" && role !== "operator";
  if (hasTokenVersion && payload.tv !== Number(user.token_version)) return null;

  const notDeleted = role === "customer" ? " AND deleted_at IS NULL" : "";
  // operator_profiles has no operator_profiles_id column: an operator is its own operator.
  const operatorColumn = role === "operator" ? "id" : "operator_profiles_id";
  const [profiles] = await database.query(
    `SELECT id, ${operatorColumn} AS operator_id FROM ${roles[role].profileTable} WHERE user_id = ?${notDeleted}`,
    [payload.id],
  );
  const profile = profiles[0];
  if (!profile) return null;

  return { role, profileId: profile.id, operatorId: profile.operator_id };
}

module.exports = { signIn };
