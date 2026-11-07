import cron from "node-cron";
import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { outbox } from "../db/schema/outbox.js";
import { Publish as PublishKafka } from "../kafka/publisher.js";
import { PublishRabbitMQ } from "../rabbitmq/publisher.js";
import { WhatsAppService } from "../modules/whatsapp/whatsapp.service.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Fungsi eksekutor untuk memproses dan mengirim 1 pesan outbox
export async function processOutboxMessage(outboxMessage) {
  try {
    // 1. Jika topik notifikasi WhatsApp langsung
    if (outboxMessage.topic === "whatsapp.notification") {
      const payload =
        typeof outboxMessage.payload === "string"
          ? JSON.parse(outboxMessage.payload)
          : outboxMessage.payload;

      await WhatsAppService.sendMessage({
        to: payload.to,
        message: payload.message,
      });

      await db
        .update(outbox)
        .set({
          status: "SENT",
          published_at: new Date(),
          last_error: null,
        })
        .where(eq(outbox.id, outboxMessage.id));

      logger.info(
        { outboxId: outboxMessage.id, to: payload.to },
        "[OUTBOX] WhatsApp notification successfully delivered"
      );
      return true;
    }

    // 2. Relay event ke message broker (RabbitMQ atau Kafka)
    const brokerType = (env.MESSAGE_BROKER || "rabbitmq").toLowerCase();
    const routingKey =
      outboxMessage.event_key ||
      outboxMessage.headers?.event_type ||
      outboxMessage.topic ||
      "general.event";

    // Normalisasi payload
    let payloadObj = outboxMessage.payload;
    if (typeof payloadObj === "string") {
      try {
        payloadObj = JSON.parse(payloadObj);
      } catch (e) {
        payloadObj = { message: payloadObj };
      }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const candidateId = payloadObj.event_id || outboxMessage.headers?.event_id;
    const eventId =
      candidateId && uuidRegex.test(String(candidateId))
        ? String(candidateId)
        : crypto.randomUUID();

    const eventType = payloadObj.event_type || outboxMessage.headers?.event_type || routingKey;

    const enrichedPayload = {
      ...payloadObj,
      event_id: eventId,
      event_type: eventType,
    };

    if (brokerType === "rabbitmq") {
      await PublishRabbitMQ({
        routingKey,
        payload: enrichedPayload,
        headers: {
          event_id: eventId,
          event_type: eventType,
          ...(outboxMessage.headers || {}),
        },
        messageId: eventId,
      });

      logger.debug(
        { outboxId: outboxMessage.id, routingKey },
        "[OUTBOX] Event successfully relayed to RabbitMQ"
      );
    } else {
      await PublishKafka({
        topic: outboxMessage.topic,
        messages: [
          {
            key: outboxMessage.event_key || undefined,
            value: JSON.stringify(enrichedPayload),
            headers: outboxMessage.headers || undefined,
          },
        ],
      });

      logger.debug(
        { outboxId: outboxMessage.id, topic: outboxMessage.topic },
        "[OUTBOX] Event successfully relayed to Kafka"
      );
    }

    await db
      .update(outbox)
      .set({
        status: "SENT",
        published_at: new Date(),
        last_error: null,
      })
      .where(eq(outbox.id, outboxMessage.id));

    return true;
  } catch (itemError) {
    const newRetryCount = (outboxMessage.retry_count || 0) + 1;
    const isMaxRetried = newRetryCount >= (outboxMessage.max_retry_count || 3);

    await db
      .update(outbox)
      .set({
        retry_count: newRetryCount,
        status: isMaxRetried ? "FAILED" : "PENDING",
        last_error: itemError.message,
      })
      .where(eq(outbox.id, outboxMessage.id));

    logger.error(
      {
        outboxId: outboxMessage.id,
        retryCount: newRetryCount,
        isMaxRetried,
        error: itemError.message,
      },
      "[OUTBOX] Failed to relay event to broker"
    );
    return false;
  }
}

// Background Cron Job (Safety Net) berjalan setiap menit
export const initOutboxRelayJobs = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const outboxMessages = await db
        .select()
        .from(outbox)
        .where(and(eq(outbox.status, "PENDING"), isNull(outbox.published_at)))
        .limit(50);

      if (outboxMessages.length === 0) return;

      logger.info(
        { count: outboxMessages.length },
        "[OUTBOX] Processing pending outbox events"
      );

      for (const outboxMessage of outboxMessages) {
        await processOutboxMessage(outboxMessage);
      }
    } catch (jobError) {
      logger.error(
        { error: jobError.message },
        "[OUTBOX] Error in outbox relay cron job"
      );
    }
  });
};
