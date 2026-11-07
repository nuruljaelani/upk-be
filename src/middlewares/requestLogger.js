import crypto from "node:crypto";
import { logger } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const reqId = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader("X-Request-Id", reqId);

  req.log = logger.child({ reqId });

  const startTime = performance.now();

  res.on("finish", () => {
    const duration = Math.round(performance.now() - startTime);
    const { method, originalUrl, ip } = req;
    const statusCode = res.statusCode;

    // Filter out health check from verbose logs if needed, or keep debug
    if (originalUrl === "/api/health") {
      req.log.debug({ method, url: originalUrl, statusCode, duration }, "Health check ping");
      return;
    }

    const logPayload = {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip: ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    };

    if (statusCode >= 500) {
      req.log.error(logPayload, `HTTP ${method} ${originalUrl} failed`);
    } else if (statusCode >= 400) {
      req.log.warn(logPayload, `HTTP ${method} ${originalUrl} client error`);
    } else {
      req.log.info(logPayload, `HTTP ${method} ${originalUrl} completed`);
    }
  });

  next();
}

export default requestLogger;
