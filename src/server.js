const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const { pool } = require("./config/db");

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    const connection = await pool.getConnection();
    connection.release();

    app.listen(PORT, () => {
      console.log(`Room booking API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to DB connection issue:", error.message);
    process.exit(1);
  }
}

startServer();
