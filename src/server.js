const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const { pool, getDbDebugInfo } = require("./config/db");

const PORT = Number(process.env.PORT);

async function startServer() {
  try {
    const connection = await pool.getConnection();
    connection.release();

    app.listen(PORT, () => {
      console.log(`Room booking API listening on port ${PORT}`);
    });
  } catch (error) {
    const db = getDbDebugInfo();
    console.error(
      `Failed to start server due to DB connection issue (${db.host}:${db.port}/${db.database}):`,
      error.message
    );
    if (error.code === "ENOTFOUND") {
      console.error(
        "DB_HOST could not be resolved. Use the exact RDS endpoint from AWS Console (without protocol)."
      );
    }
    process.exit(1);
  }
}

startServer();
