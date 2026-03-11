#!/usr/bin/env node
/**
 * Apply schema to MySQL/RDS. Uses .env for connection.
 * Usage: node scripts/run-schema.js [schema-file]
 * Default: db/schema.sql
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { buildDbConfig, getDbDebugInfo } = require("../src/config/getDbConfig");

const schemaFile = process.argv[2] || path.join(__dirname, "..", "db", "schema.sql");

async function run() {
  const config = buildDbConfig({ includeDatabase: false, multipleStatements: true, pool: false });
  const db = getDbDebugInfo();
  console.log("Connecting to", db.host + ":" + db.port, "...");
  const conn = await mysql.createConnection(config);

  try {
    const schema = fs.readFileSync(schemaFile, "utf8");
    await conn.query(schema);
    console.log("Schema applied successfully from", schemaFile);
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  if (err.code === "ENOTFOUND") {
    console.error(
      "Failed: DB_HOST could not be resolved. Verify your exact RDS endpoint in AWS Console."
    );
  } else {
    console.error("Failed:", err.message);
  }
  process.exit(1);
});
