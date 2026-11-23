require("dotenv").config();

const requiredSettings = ["JWT_SECRET", "DB_HOST", "DB_USERNAME", "DB_DATABASE"];
const minimumSecretLength = 32;

function readSettings(env) {
  const missing = requiredSettings.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing settings: ${missing.join(", ")}`);
  }
  if (env.JWT_SECRET.length < minimumSecretLength) {
    throw new Error(`JWT_SECRET must be at least ${minimumSecretLength} characters (use the same one as delivery-x-be)`);
  }

  return Object.freeze({
    isProduction: env.NODE_ENV === "production",
    port: Number(env.PORT) || 9002,
    jwtSecret: env.JWT_SECRET,
    database: Object.freeze({
      host: env.DB_HOST,
      port: Number(env.DB_PORT) || 3306,
      user: env.DB_USERNAME,
      password: env.DB_PASSWORD || "",
      name: env.DB_DATABASE,
    }),
  });
}

module.exports = readSettings(process.env);
