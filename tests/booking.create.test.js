const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/config/db");
const { truncateUsersAndBookings, registerAndGetToken } = require("./helpers");

describe("Bookings - Create (POST /api/bookings)", () => {
  let token;

  beforeEach(async () => {
    await truncateUsersAndBookings();
    token = await registerAndGetToken();
  });

  describe("Auth", () => {
    it("B1: No Authorization header returns 401", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/authorization|token/i);
    });

    it("B2: Invalid/expired JWT returns 401", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", "Bearer invalid.token")
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid|expired/i);
    });

    it("B3: JWT with deleted user (stale token) returns 401", async () => {
      const email = "stale@example.com";
      const pass = "pass123";
      await request(app)
        .post("/api/auth/register")
        .send({ name: "Stale User", email, password: pass });
      const { getAuthToken } = require("./helpers");
      const staleToken = await getAuthToken(email, pass);
      const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      const userId = rows[0].id;
      await pool.query("DELETE FROM users WHERE id = ?", [userId]);
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${staleToken}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/user not found|not found/i);
    });
  });

  describe("Body validation", () => {
    it("B4: Missing roomId returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/roomId/i);
    });

    it("B5: roomId as string '1' (coerced) returns 201", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: "1", startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(201);
      expect(res.body.data.bookingId).toBeDefined();
    });

    it("B6: roomId=0 returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 0, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/positive|roomId/i);
    });

    it("B7: roomId=-1 returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: -1, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(400);
    });

    it("B8: roomId=1.5 returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1.5, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/integer|roomId/i);
    });

    it("B9: Missing startDate returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, endDate: "2026-03-12" });
      expect(res.status).toBe(400);
    });

    it("B10: Missing endDate returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10" });
      expect(res.status).toBe(400);
    });

    it("B11: Invalid date format returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "03-10-2026", endDate: "2026-03-12" });
      expect(res.status).toBe(400);
    });

    it("B12: Invalid calendar date (2026-02-31) returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-02-31", endDate: "2026-03-12" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|date|range/i);
    });

    it("B13: endDate < startDate returns 400", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-12", endDate: "2026-03-10" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|range/i);
    });
  });

  describe("Business logic", () => {
    it("B14: Non-existent room (999) returns 404", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 999, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/room.*not found|not found/i);
    });

    it("B15: Valid request, no overlaps returns 201 with bookingId", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        roomId: 1,
        startDate: "2026-03-10",
        endDate: "2026-03-12",
      });
      expect(res.body.data.bookingId).toBeDefined();
    });

    it("B16: Overlapping with existing booking returns 409", async () => {
      await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-11", endDate: "2026-03-13" });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already booked|booked/i);
    });

    it("B17: Overlap - new spans existing returns 409", async () => {
      await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-11", endDate: "2026-03-12" });
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-13" });
      expect(res.status).toBe(409);
    });

    it("B18: Overlap - new inside existing returns 409", async () => {
      await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-15" });
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-12", endDate: "2026-03-13" });
      expect(res.status).toBe(409);
    });

    it("B19: Overlap - new ends when existing starts (boundary) returns 409", async () => {
      await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-12", endDate: "2026-03-14" });
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      expect(res.status).toBe(409);
    });

    it("B20: No overlap - new starts day after existing ends returns 201", async () => {
      await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-13", endDate: "2026-03-15" });
      expect(res.status).toBe(201);
    });

    it("B21: Same user books same room twice, non-overlapping returns 201 twice", async () => {
      const res1 = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-04-01", endDate: "2026-04-03" });
      const res2 = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-04-05", endDate: "2026-04-07" });
      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.bookingId).not.toBe(res2.body.data.bookingId);
    });

    it("B22: Same-day booking (startDate=endDate) returns 201 if no overlap", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-05-15", endDate: "2026-05-15" });
      expect(res.status).toBe(201);
    });
  });
});
