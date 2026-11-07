import pino from "pino";
import { env } from "../config/env.js";

const isDev = env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "password_hash",
      "*.password",
      "*.password_hash",
      "otp",
      "*.otp",
      "token",
      "*.token",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export default logger;
