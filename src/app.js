const express = require("express");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
