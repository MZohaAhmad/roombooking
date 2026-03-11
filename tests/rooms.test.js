const request = require("supertest");
const app = require("../src/app");

describe("Rooms - List (GET /api/rooms)", () => {
  it("Rm1: GET /api/rooms without auth returns 200 with array of rooms", async () => {
    const res = await request(app).get("/api/rooms");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((room) => {
      expect(room).toHaveProperty("id");
      expect(room).toHaveProperty("name");
      expect(room).toHaveProperty("price_per_night");
    });
  });

  it("Rm2: Returns array (empty if no rooms)", async () => {
    const res = await request(app).get("/api/rooms");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Rm3: With seeded data returns 3 rooms (Deluxe, Executive, Standard)", async () => {
    const res = await request(app).get("/api/rooms");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    const names = res.body.data.map((r) => r.name);
    expect(names).toContain("Deluxe Room");
    expect(names).toContain("Executive Suite");
    expect(names).toContain("Standard Room");
  });
});
