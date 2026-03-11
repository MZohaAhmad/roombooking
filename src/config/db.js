const mysql = require("mysql2/promise");
const { buildDbConfig, getDbDebugInfo } = require("./getDbConfig");

const poolConfig = buildDbConfig({ includeDatabase: true, pool: true });
const pool = mysql.createPool(poolConfig);

module.exports = { pool, getDbDebugInfo };
