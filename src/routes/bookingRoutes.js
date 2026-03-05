const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { checkAvailability, bookRoom } = require("../controllers/bookingController");
const {
  availabilityParamsSchema,
  availabilityQuerySchema,
  bookingBodySchema
} = require("../validation/bookingSchemas");

const router = express.Router();

router.get(
  "/availability/:roomId",
  authMiddleware,
  validate(availabilityParamsSchema, "params"),
  validate(availabilityQuerySchema, "query"),
  checkAvailability
);

router.post("/", authMiddleware, validate(bookingBodySchema, "body"), bookRoom);

module.exports = router;
