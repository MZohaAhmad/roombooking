const express = require("express");
const { register, login } = require("../controllers/authController");
const { validate } = require("../middleware/validationMiddleware");
const { registerSchema, loginSchema } = require("../validation/authSchemas");

const router = express.Router();

router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);

module.exports = router;
