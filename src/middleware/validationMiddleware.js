const { ZodError } = require("zod");
const ApiError = require("../utils/ApiError");

function formatZodError(error) {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

function validate(schema, property = "body") {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[property]);
      req[property] = parsed;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = formatZodError(error);
        return next(new ApiError(400, message));
      }
      return next(error);
    }
  };
}

module.exports = { validate };
