const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../utils/jwt");

async function registerUser({ name, email, password }) {
  const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);

  if (existingUsers.length > 0) {
    throw new ApiError(409, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    return {
      id: result.insertId,
      name,
      email
    };
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "Email is already registered");
    }
    throw error;
  }
}

async function loginUser({ email, password }) {
  const [users] = await pool.query(
    "SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  if (users.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const user = users[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken({ id: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

module.exports = { registerUser, loginUser };
