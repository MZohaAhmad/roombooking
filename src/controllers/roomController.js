const { listRooms } = require("../services/roomService");

async function getRooms(req, res, next) {
  try {
    const rooms = await listRooms();
    return res.status(200).json({
      success: true,
      message: "Rooms fetched successfully",
      data: rooms
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getRooms };
