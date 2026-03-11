const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");
const { buildDbConfig } = require("../src/config/getDbConfig");

module.exports = async function globalSetup() {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
  dotenv.config({ path: path.join(__dirname, "..", ".env.test"), override: true });

  process.env.NODE_ENV = "test";
  process.env.DB_NAME = process.env.DB_NAME || "room_booking_test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

  const poolConfig = buildDbConfig({ includeDatabase: false, multipleStatements: true, pool: true });

  const pool = mysql.createPool(poolConfig);

  const schemaPath = path.join(__dirname, "..", "db", "schema.test.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  try {
    const connection = await pool.getConnection();
    try {
      await connection.query(schema);
    } finally {
      connection.release();
    }
    await pool.end();
  } catch (err) {
    await pool.end().catch(() => {});
    const msg =
      err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED"
        ? "Database connection failed (ETIMEDOUT/ECONNREFUSED). Check RDS security group allows your IP on port 3306, and RDS is publicly accessible."
        : "Database setup failed. Ensure MySQL/RDS is running and .env/.env.test are configured.";
    console.error(msg);
    throw err;
  }
};
