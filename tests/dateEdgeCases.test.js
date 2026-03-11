const request = require("supertest");
const app = require("../src/app");
const { truncateUsersAndBookings, registerAndGetToken } = require("./helpers");

describe("Date Edge Cases", () => {
  let token;

  beforeEach(async () => {
    await truncateUsersAndBookings();
    token = await registerAndGetToken();
  });

  it("D1: Same-day (2026-01-01 to 2026-01-01) is valid for availability", async () => {
    const res = await request(app)
      .get("/api/bookings/availability/1?startDate=2026-01-01&endDate=2026-01-01")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("available");
  });

  it("D1b: Same-day (2026-01-01 to 2026-01-01) is valid for booking", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomId: 1, startDate: "2026-01-01", endDate: "2026-01-01" });
    expect(res.status).toBe(201);
  });

  it("D2: Leap year 2024-02-29 is valid", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomId: 1, startDate: "2024-02-29", endDate: "2024-02-29" });
    expect(res.status).toBe(201);
  });

  it("D3: Non-leap 2023-02-29 returns 400 (invalid calendar date)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomId: 1, startDate: "2023-02-29", endDate: "2023-03-01" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid|date|range/i);
  });

  it("D4: Cross-year range (2026-12-31 to 2027-01-01) is valid", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomId: 1, startDate: "2026-12-31", endDate: "2027-01-01" });
    expect(res.status).toBe(201);
  });

  it("D5: Past dates (2020-01-01) are accepted", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ roomId: 1, startDate: "2020-01-01", endDate: "2020-01-02" });
    expect(res.status).toBe(201);
  });
});
