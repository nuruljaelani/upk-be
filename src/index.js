import app from "./app.js";
import { env } from "./config/env.js";
import { initCleanupJobs } from "./jobs/cleanup.job.js";
import { initOutboxRelayJobs } from "./jobs/outbox.job.js";
import { startOutboxWorker, stopOutboxWorker } from "./modules/whatsapp/outbox.worker.js";
import { closeRabbitMQ } from "./config/rabbitmq.js";
import { logger } from "./utils/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 [Koperasi-BE] Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`📡 Health check available at: http://localhost:${env.PORT}/api/health`);

  // Start scheduled jobs
  initCleanupJobs();
  initOutboxRelayJobs();
  startOutboxWorker({ intervalMs: 10000 });
});

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);
  stopOutboxWorker();
  await closeRabbitMQ();
  server.close(() => {
    logger.info("🔒 HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
