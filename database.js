const { createPool } = require("mysql2/promise");
const { database } = require("./config");

module.exports = createPool({
  host: database.host,
  port: database.port,
  user: database.user,
  password: database.password,
  database: database.name,
  connectionLimit: 5,
});
