const { pool } = require("../config/db");

async function listRooms() {
  const [rooms] = await pool.query("SELECT id, name, price_per_night FROM rooms ORDER BY id ASC");
  return rooms;
}

module.exports = { listRooms };
