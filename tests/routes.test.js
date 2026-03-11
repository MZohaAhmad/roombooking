const request = require("supertest");
const app = require("../src/app");

describe("Route / Error Handler", () => {
  it("E1: GET /api/nonexistent returns 404 with route not found message", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Route not found.*GET.*\/api\/nonexistent/i);
  });

  it("E2: POST /api/auth/register with invalid JSON returns 400 or 500", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send("not valid json {{{");
    expect([400, 500]).toContain(res.status);
  });
});
