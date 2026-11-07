import amqp from "amqplib";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const rabbitUrl = env.RABBITMQ_URL;
const defaultExchange = env.RABBITMQ_EXCHANGE_NAME;

let connection = null;
let channel = null;
let isConnecting = false;

/**
 * Mengambil atau menginisialisasi Channel RabbitMQ (Singleton dengan auto-reconnect)
 */
export async function getRabbitMQChannel() {
  if (channel) return channel;
  if (isConnecting) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (channel) return channel;
  }

  isConnecting = true;
  try {
    connection = await amqp.connect(rabbitUrl);

    connection.on("error", (err) => {
      logger.error({ error: err.message }, "[RabbitMQ] Connection error");
      channel = null;
      connection = null;
    });

    connection.on("close", () => {
      logger.warn("[RabbitMQ] Connection closed, will reconnect on next request");
      channel = null;
      connection = null;
    });

    channel = await connection.createChannel();

    // Pastikan exchange default bertipe 'topic' sudah terdaftar (durable)
    await channel.assertExchange(defaultExchange, "topic", {
      durable: true,
    });

    logger.info(
      { exchange: defaultExchange, url: rabbitUrl.replace(/:[^:]*@/, ":***@") },
      "🐰 [RabbitMQ] Connected and exchange asserted successfully"
    );

    return channel;
  } catch (error) {
    logger.error({ error: error.message }, "[RabbitMQ] Failed to connect to broker");
    channel = null;
    connection = null;
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Menutup koneksi RabbitMQ secara graceful saat server shutdown
 */
export async function closeRabbitMQ() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info("[RabbitMQ] Connection closed gracefully");
  } catch (err) {
    logger.warn({ error: err.message }, "[RabbitMQ] Error while closing connection");
  }
}

export default {
  getRabbitMQChannel,
  closeRabbitMQ,
};
