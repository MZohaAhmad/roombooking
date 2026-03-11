const request = require("supertest");
const app = require("../src/app");
const { truncateUsersAndBookings } = require("./helpers");

describe("Auth - Login (POST /api/auth/login)", () => {
  beforeEach(async () => {
    await truncateUsersAndBookings();
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Jane Doe", email: "jane@example.com", password: "secret123" });
  });

  it("L1: Valid email + correct password returns 200 with token and user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "secret123" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("user");
    expect(res.body.data.user).toMatchObject({ email: "jane@example.com" });
  });

  it("L2: Missing email returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "secret123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email|valid/i);
  });

  it("L3: Invalid email format returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "badformat", password: "secret123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email|valid/i);
  });

  it("L4: Missing password returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password.*required/i);
  });

  it("L5: Empty password string returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password.*required/i);
  });

  it("L6: Non-existent email returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@example.com", password: "secret123" });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid|password/i);
  });

  it("L7: Correct email, wrong password returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid|password/i);
  });

  it("L8: Case sensitivity of email - verify behavior", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "JANE@example.com", password: "secret123" });
    if (res.status === 200) {
      expect(res.body.data.user).toBeDefined();
    } else {
      expect(res.status).toBe(401);
    }
  });
});
