const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/config/db");

async function truncateUsersAndBookings() {
  await pool.query("DELETE FROM bookings");
  await pool.query("DELETE FROM users");
}

async function getAuthToken(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed: ${res.body.message}`);
  return res.body.data.token;
}

async function registerAndGetToken(payload = {}) {
  const { name = "Test User", email = "test@example.com", password = "password123" } = payload;
  await request(app).post("/api/auth/register").send({ name, email, password });
  return getAuthToken(email, password);
}

module.exports = {
  truncateUsersAndBookings,
  getAuthToken,
  registerAndGetToken,
};
