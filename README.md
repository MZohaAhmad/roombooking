# Room Booking System API

Node.js + Express + MySQL backend for room booking with JWT authentication and overlap-safe booking logic.

## Features

- User registration and login (`bcryptjs` + JWT)
- Room listing endpoint
- Protected availability check endpoint
- Protected booking creation endpoint
- Overlap prevention for same-room bookings
- Booking transaction handling with row-level locking

## Tech Stack

- Node.js
- Express
- MySQL (`mysql2/promise`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)

## Project Structure

```text
src/
  app.js
  server.js
  config/
    db.js
  controllers/
    authController.js
    roomController.js
    bookingController.js
  middleware/
    authMiddleware.js
    errorMiddleware.js
  routes/
    authRoutes.js
    roomRoutes.js
    bookingRoutes.js
  services/
    userService.js
    roomService.js
    bookingService.js
  utils/
    ApiError.js
    jwt.js
db/
  schema.sql
postman/
  room-booking-api.postman_collection.json
architecture-notes.txt
```

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your MySQL credentials and JWT secret.

4. Create schema and seed rooms:

```bash
mysql -u <user> -p < db/schema.sql
```

5. Run the server:

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

## API Endpoints

### Health

- `GET /health`

### Auth

- `POST /api/auth/register`
  - Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
- `POST /api/auth/login`
  - Body: `{ "email": "john@example.com", "password": "password123" }`
  - Returns JWT token

### Rooms

- `GET /api/rooms`

### Bookings (Protected)

All booking endpoints require:

`Authorization: Bearer <token>`

- `GET /api/bookings/availability/:roomId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- `POST /api/bookings`
  - Body: `{ "roomId": 1, "startDate": "2026-03-10", "endDate": "2026-03-12" }`

## Overlap Logic

A new booking conflicts if there is any existing booking for the same room where:

`existing.start_date <= requested.end_date AND existing.end_date >= requested.start_date`

If conflict exists, API returns HTTP `409 Conflict`.

## Transaction Behavior

Booking creation runs in a DB transaction:

1. Lock room row via `SELECT ... FOR UPDATE`
2. Check overlap
3. Insert booking if available
4. Commit transaction

If any step fails, rollback is applied.

## Postman Collection

Import:

`postman/room-booking-api.postman_collection.json`

## Notes

See `architecture-notes.txt` for:

- overlap prevention summary
- concurrent booking behavior
- future scaling approach
# roombooking
