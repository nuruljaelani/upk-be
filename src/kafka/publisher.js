import { getKafkaProducer } from "../config/kafka.js";
import { logger } from "../utils/logger.js";

export const Publish = async ({ topic, messages }) => {
  try {
    const producer = await getKafkaProducer();
    const result = await producer.send({
      topic,
      acks: -1,
      messages,
    });
    logger.debug({ topic, count: messages?.length }, "Kafka messages published successfully");
    return result;
  } catch (error) {
    logger.error({ error: error.message, topic }, "Failed to publish messages to Kafka");
    throw error;
  }
};