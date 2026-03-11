const request = require("supertest");
const app = require("../src/app");
const { truncateUsersAndBookings, registerAndGetToken } = require("./helpers");

describe("Bookings - Check Availability (GET /api/bookings/availability/:roomId)", () => {
  let token;

  beforeEach(async () => {
    await truncateUsersAndBookings();
    token = await registerAndGetToken();
  });

  const availabilityUrl = (roomId, startDate, endDate) =>
    `/api/bookings/availability/${roomId}?startDate=${startDate}&endDate=${endDate}`;

  describe("Auth", () => {
    it("A1: No Authorization header returns 401", async () => {
      const res = await request(app).get(
        "/api/bookings/availability/1?startDate=2026-03-10&endDate=2026-03-12"
      );
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/authorization|token/i);
    });

    it("A2: Malformed Bearer header returns 401", async () => {
      const res = await request(app)
        .get("/api/bookings/availability/1?startDate=2026-03-10&endDate=2026-03-12")
        .set("Authorization", "Bearer");
      expect(res.status).toBe(401);
    });

    it("A3: Invalid/expired JWT returns 401", async () => {
      const res = await request(app)
        .get("/api/bookings/availability/1?startDate=2026-03-10&endDate=2026-03-12")
        .set("Authorization", "Bearer invalid.token.here");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid|expired/i);
    });

    it("A4: Valid JWT proceeds to availability logic", async () => {
      const res = await request(app)
        .get("/api/bookings/availability/1?startDate=2026-03-10&endDate=2026-03-12")
        .set("Authorization", `Bearer ${token}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("Params validation", () => {
    it("A5: roomId=0 returns 400", async () => {
      const res = await request(app)
        .get(availabilityUrl("0", "2026-03-10", "2026-03-12"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/roomId|positive/i);
    });

    it("A6: roomId=-1 returns 400", async () => {
      const res = await request(app)
        .get(availabilityUrl("-1", "2026-03-10", "2026-03-12"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("A7: roomId=abc returns 400", async () => {
      const res = await request(app)
        .get(availabilityUrl("abc", "2026-03-10", "2026-03-12"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("A8: Path without roomId segment returns 404", async () => {
      const res = await request(app)
        .get("/api/bookings/availability?startDate=2026-03-10&endDate=2026-03-12")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("Query validation", () => {
    it("A9: Missing startDate returns 400", async () => {
      const res = await request(app)
        .get("/api/bookings/availability/1?endDate=2026-03-12")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("A10: Missing endDate returns 400", async () => {
      const res = await request(app)
        .get("/api/bookings/availability/1?startDate=2026-03-10")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("A11: Invalid date format returns 400", async () => {
      const res = await request(app)
        .get("/api/bookings/availability/1?startDate=03-10-2026&endDate=2026-03-12")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/YYYY-MM-DD|format|date/i);
    });

    it("A12: Invalid calendar date (2026-02-31) returns 400", async () => {
      const res = await request(app)
        .get(availabilityUrl("1", "2026-02-31", "2026-03-12"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|date|range/i);
    });

    it("A13: endDate before startDate returns 400", async () => {
      const res = await request(app)
        .get(availabilityUrl("1", "2026-03-12", "2026-03-10"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|range/i);
    });
  });

  describe("Business logic", () => {
    it("A14: Non-existent room (999) returns 404", async () => {
      const res = await request(app)
        .get(availabilityUrl("999", "2026-03-10", "2026-03-12"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/room.*not found|not found/i);
    });

    it("A15: Existing room, no overlapping bookings returns available: true", async () => {
      const res = await request(app)
        .get(availabilityUrl("1", "2026-03-10", "2026-03-12"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(true);
    });

    it("A16: Existing room with overlapping booking returns available: false", async () => {
      await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: 1, startDate: "2026-03-10", endDate: "2026-03-12" });
      const res = await request(app)
        .get(availabilityUrl("1", "2026-03-11", "2026-03-13"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(false);
    });

    it("A17: Same-day check-in/out (startDate=endDate)", async () => {
      const res = await request(app)
        .get(availabilityUrl("1", "2026-03-10", "2026-03-10"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("available");
    });

    it("A18: Single-day range with no bookings returns available: true", async () => {
      const res = await request(app)
        .get(availabilityUrl("1", "2026-06-01", "2026-06-01"))
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(true);
    });
  });
});
