import { ApiError } from "../utils/ApiError.js";

// Validates req.body against a Zod schema and replaces it with the parsed result.
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(400, "Validation failed", result.error.issues);
  }
  req.body = result.data;
  next();
};
