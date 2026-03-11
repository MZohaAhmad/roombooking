const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.test") });

process.env.NODE_ENV = "test";
process.env.DB_NAME = process.env.DB_NAME || "room_booking_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
