import { isProd } from "../config/env.js";

// Express identifies error handlers by their 4-argument signature.
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode ?? 500;

  if (statusCode >= 500) req.log.error(err);

  res.status(statusCode).json({
    message: statusCode >= 500 && isProd ? "Internal server error" : err.message,
    ...(err.details && { details: err.details }),
    ...(!isProd && statusCode >= 500 && { stack: err.stack }),
  });
}
