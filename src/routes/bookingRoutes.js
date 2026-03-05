const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkAvailability, bookRoom } = require("../controllers/bookingController");

const router = express.Router();

router.get("/availability/:roomId", authMiddleware, checkAvailability);
router.post("/", authMiddleware, bookRoom);

module.exports = router;
