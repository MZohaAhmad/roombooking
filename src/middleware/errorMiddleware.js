function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
}

module.exports = { notFoundHandler, errorHandler };
