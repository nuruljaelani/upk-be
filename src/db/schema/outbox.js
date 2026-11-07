import { pgTable, varchar, jsonb, timestamp, bigserial, integer, text } from "drizzle-orm/pg-core";

export const outbox = pgTable("outbox", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  topic: varchar("topic", { length: 100 }).notNull(),
  event_key: varchar("event_key", { length: 100 }),
  headers: jsonb("headers"),
  payload: jsonb("payload").notNull(),
  retry_count: integer("retry_count").notNull().default(0),
  max_retry_count: integer("max_retry_count").notNull().default(3),
  last_error: text("last_error"),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"), // PENDING, SENT, FAILED
  published_at: timestamp("published_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
