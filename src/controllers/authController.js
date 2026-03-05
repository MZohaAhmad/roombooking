const ApiError = require("../utils/ApiError");
const { registerUser, loginUser } = require("../services/userService");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login };
