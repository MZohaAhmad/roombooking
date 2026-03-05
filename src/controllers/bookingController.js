const ApiError = require("../utils/ApiError");
const { checkRoomAvailability, createBooking, isValidDateInput } = require("../services/bookingService");
const { getRoomById } = require("../services/roomService");

async function checkAvailability(req, res, next) {
  try {
    const roomId = Number(req.params.roomId);
    const { startDate, endDate } = req.query;

    if (!isValidDateInput(startDate, endDate)) {
      throw new ApiError(400, "Invalid date range. Ensure dates are valid and startDate <= endDate");
    }

    const room = await getRoomById(roomId);
    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    const available = await checkRoomAvailability(roomId, startDate, endDate);

    return res.status(200).json({
      success: true,
      message: available ? "Room is available" : "Room is not available",
      data: { available }
    });
  } catch (error) {
    return next(error);
  }
}

async function bookRoom(req, res, next) {
  try {
    const { roomId, startDate, endDate } = req.body;

    const booking = await createBooking({
      userId: req.user.id,
      roomId: Number(roomId),
      startDate,
      endDate
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { checkAvailability, bookRoom };
