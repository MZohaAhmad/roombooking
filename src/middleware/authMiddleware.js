const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authorization token is required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

module.exports = authMiddleware;
