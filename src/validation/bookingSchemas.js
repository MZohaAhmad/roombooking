const { z } = require("zod");

const dateStringSchema = z
  .string()
  .min(1, "date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format");

const availabilityParamsSchema = z.object({
  roomId: z
    .string()
    .regex(/^\d+$/, "roomId must be a positive integer")
    .refine((value) => Number(value) > 0, "roomId must be a positive integer")
});

const availabilityQuerySchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema
});

const bookingBodySchema = z.object({
  roomId: z.coerce
    .number({
      required_error: "roomId is required",
      invalid_type_error: "roomId must be a number"
    })
    .int("roomId must be an integer")
    .positive("roomId must be positive"),
  startDate: dateStringSchema,
  endDate: dateStringSchema
});

module.exports = {
  availabilityParamsSchema,
  availabilityQuerySchema,
  bookingBodySchema
};

