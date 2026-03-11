const fs = require("fs");
const path = require("path");

function buildDbConfig(opts = {}) {
  const {
    includeDatabase = true,
    pool = false,
    multipleStatements = false,
  } = opts;

  const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000,
  };

  if (includeDatabase) {
    config.database = process.env.DB_NAME || "room_booking";
  }

  if (multipleStatements) {
    config.multipleStatements = true;
  }

  if (pool) {
    config.waitForConnections = true;
    config.connectionLimit = 10;
    config.queueLimit = 0;
  }

  if (process.env.DB_SSL_CA) {
    const caPath = path.isAbsolute(process.env.DB_SSL_CA)
      ? process.env.DB_SSL_CA
      : path.join(process.cwd(), process.env.DB_SSL_CA);
    try {
      config.ssl = {
        ca: fs.readFileSync(caPath, "utf8"),
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
      };
    } catch (err) {
      console.warn("DB_SSL_CA file not found, SSL disabled:", err.message);
    }
  } else if (process.env.DB_SSL === "true" || process.env.DB_SSL === "1") {
    config.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true" };
  }

  return config;
}

function getDbDebugInfo() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || "room_booking",
  };
}

module.exports = { buildDbConfig, getDbDebugInfo };
