const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email("email must be a valid email address"),
  password: z.string().min(6, "password must be at least 6 characters long")
});

const loginSchema = z.object({
  email: z.string().email("email must be a valid email address"),
  password: z.string().min(1, "password is required")
});

module.exports = { registerSchema, loginSchema };
