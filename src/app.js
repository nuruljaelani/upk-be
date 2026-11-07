import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import simpananRoutes from "./modules/simpanan/simpanan.routes.js";
import pinjamanRoutes from "./modules/pinjaman/pinjaman.routes.js";
import boRoutes from "./modules/backoffice/bo.routes.js";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import contentRoutes from "./modules/content/content.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { ApiResponse } from "./utils/response.js";

const app = express();

// HTTP Request Logger
app.use(requestLogger);

// Security and standard middlewares
app.use(helmet());
const allowedOrigins = Array.from(
  new Set([env.CORS_ORIGIN, "http://localhost:3000", "http://localhost:3001"].filter(Boolean))
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Koperasi Backend API is running smoothly",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/simpanan", simpananRoutes);
app.use("/api/pinjaman", pinjamanRoutes);
app.use("/api/bo", boRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/content", contentRoutes);

// Fallback 404 Route Handler
app.use((_req, res) => {
  return ApiResponse.error(res, "Endpoint tidak ditemukan", 404);
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
