import { ApiError } from "../utils/errors.js";
import { ApiResponse } from "../utils/response.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  const log = req.log || logger;

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      log.error({ err, path: req.originalUrl }, err.message);
    } else {
      log.warn({ err: err.message, statusCode: err.statusCode, path: req.originalUrl }, "Handled operational error");
    }
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  // Log unhandled server error
  log.error({ err, path: req.originalUrl }, "💥 Unhandled Server Error");

  const message =
    env.NODE_ENV === "production"
      ? "Terjadi kesalahan internal pada server"
      : err.message || "Internal Server Error";

  return ApiResponse.error(
    res,
    message,
    500,
    env.NODE_ENV === "development" ? err.stack : undefined
  );
}
