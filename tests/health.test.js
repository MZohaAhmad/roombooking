const request = require("supertest");
const app = require("../src/app");

describe("Health Check", () => {
  it("H1: GET /health returns 200 with healthy message", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Server is healthy" });
  });
});
