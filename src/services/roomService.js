const { pool } = require("../config/db");

async function listRooms() {
  const [rooms] = await pool.query("SELECT id, name, price_per_night FROM rooms ORDER BY id ASC");
  return rooms;
}

async function getRoomById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, price_per_night FROM rooms WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

module.exports = { listRooms, getRoomById };
