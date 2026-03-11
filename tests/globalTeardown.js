const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.test") });
process.env.DB_NAME = process.env.DB_NAME || "room_booking_test";

const { pool } = require("../src/config/db");

module.exports = async function globalTeardown() {
  await pool.end();
};
