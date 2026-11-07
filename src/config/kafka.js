import { Kafka, Partitioners } from "kafkajs";

// Filter internal KafkaJS timer warning in Node.js / Bun
process.on("warning", (warning) => {
  if (warning.name === "TimeoutNegativeWarning") return;
  console.warn(warning);
});

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092")
  .split(",")
  .map((b) => b.trim());

const kafka = new Kafka({
  clientId: "koperasi-be",
  brokers,
  retry: {
    initialRetryTime: 300,
    retries: 5,
  }
});

export const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 1,
  createPartitioner: Partitioners.LegacyPartitioner,
});

let isConnected = false;

export async function getKafkaProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
  return producer;
}

export default kafka;