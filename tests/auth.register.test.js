const request = require("supertest");
const app = require("../src/app");
const { truncateUsersAndBookings } = require("./helpers");

describe("Auth - Register (POST /api/auth/register)", () => {
  beforeEach(async () => {
    await truncateUsersAndBookings();
  });

  it("R1: Valid body returns 201 with user object (no password)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John Doe", email: "john@example.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: "John Doe", email: "john@example.com" });
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).not.toHaveProperty("password");
  });

  it("R2: Missing name returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "john@example.com", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name.*required/i);
  });

  it("R3: Empty name string returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "", email: "john@example.com", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name.*required/i);
  });

  it("R4: Missing email returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email|valid/i);
  });

  it("R5: Invalid email format returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John", email: "notanemail", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email|valid/i);
  });

  it("R6: Missing password returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John", email: "john@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password|6/i);
  });

  it("R7: Password too short returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "John", email: "john@example.com", password: "12345" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password|6/i);
  });

  it("R8: Empty body returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
  });

  it("R9: Extra fields in body still succeed (Zod strips unknowns)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "John",
        email: "extra@example.com",
        password: "password123",
        extra: "ignored",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("extra@example.com");
  });

  it("R10: Duplicate email returns 409", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "John", email: "dup@example.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Jane", email: "dup@example.com", password: "otherpass" });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it("R11: Concurrent register same email - one gets 409 (race)", async () => {
    const email = "race@example.com";
    const [res1, res2] = await Promise.all([
      request(app).post("/api/auth/register").send({ name: "A", email, password: "pass123" }),
      request(app).post("/api/auth/register").send({ name: "B", email, password: "pass456" }),
    ]);
    const codes = [res1.status, res2.status];
    expect(codes).toContain(201);
    expect(codes).toContain(409);
  });
});
