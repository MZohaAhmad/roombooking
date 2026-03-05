const { pool } = require("../config/db");
const ApiError = require("../utils/ApiError");

function isValidIsoCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidDateInput(startDate, endDate) {
  if (!isValidIsoCalendarDate(startDate) || !isValidIsoCalendarDate(endDate)) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= end;
}

async function checkRoomAvailability(roomId, startDate, endDate, connection = pool) {
  const [conflictingBookings] = await connection.query(
    `SELECT id
     FROM bookings
     WHERE room_id = ?
       AND start_date <= ?
       AND end_date >= ?
     LIMIT 1`,
    [roomId, endDate, startDate]
  );

  return conflictingBookings.length === 0;
}

async function createBooking({ userId, roomId, startDate, endDate }) {
  if (!isValidDateInput(startDate, endDate)) {
    throw new ApiError(400, "Invalid date range. Ensure dates are valid and start_date <= end_date");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.query(
      "SELECT id FROM users WHERE id = ? FOR UPDATE",
      [userId]
    );
    if (users.length === 0) {
      throw new ApiError(401, "User not found");
    }

    const [rooms] = await connection.query("SELECT id FROM rooms WHERE id = ? FOR UPDATE", [roomId]);
    if (rooms.length === 0) {
      throw new ApiError(404, "Room not found");
    }

    const isAvailable = await checkRoomAvailability(roomId, startDate, endDate, connection);

    if (!isAvailable) {
      throw new ApiError(409, "Room is already booked for the selected date range");
    }

    const [result] = await connection.query(
      `INSERT INTO bookings (user_id, room_id, start_date, end_date)
       VALUES (?, ?, ?, ?)`,
      [userId, roomId, startDate, endDate]
    );

    await connection.commit();

    return {
      bookingId: result.insertId,
      userId,
      roomId,
      startDate,
      endDate
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { checkRoomAvailability, createBooking, isValidDateInput };
