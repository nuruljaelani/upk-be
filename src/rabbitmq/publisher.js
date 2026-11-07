import { getRabbitMQChannel } from "../config/rabbitmq.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const defaultExchange = env.RABBITMQ_EXCHANGE_NAME || "bukasir.events";

/**
 * Mempublikasikan pesan ke RabbitMQ Topic Exchange
 * @param {Object} params
 * @param {string} [params.exchange] Nama exchange (default: bukasir.events)
 * @param {string} params.routingKey Routing key (contoh: whatsapp.otp_requested, user.created)
 * @param {Object|string} params.payload Isi payload pesan
 * @param {Object} [params.headers] Header tambahan
 * @param {string} [params.messageId] ID unik pesan
 */
export async function PublishRabbitMQ({
  exchange = defaultExchange,
  routingKey,
  payload,
  headers = {},
  messageId,
}) {
  try {
    const ch = await getRabbitMQChannel();

    const contentBuffer = Buffer.from(
      typeof payload === "string" ? payload : JSON.stringify(payload)
    );

    const resolvedMessageId = messageId
      ? String(messageId)
      : headers.event_id
        ? String(headers.event_id)
        : undefined;

    const publishOptions = {
      persistent: true,
      contentType: "application/json",
      messageId: resolvedMessageId,
      headers: {
        event_type: headers.event_type || routingKey,
        ...headers,
      },
    };

    const published = ch.publish(exchange, routingKey, contentBuffer, publishOptions);

    logger.debug(
      { exchange, routingKey, messageId: publishOptions.messageId },
      "🐰 [RabbitMQ] Event message published successfully"
    );

    return published;
  } catch (error) {
    logger.error(
      { error: error.message, exchange, routingKey },
      "❌ [RabbitMQ] Failed to publish message"
    );
    throw error;
  }
}

export default PublishRabbitMQ;
