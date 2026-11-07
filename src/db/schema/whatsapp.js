import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const waDevices = pgTable("wa_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  device_id: varchar("device_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull().default("WhatsApp Notifikasi Utama"),
  phone_number: varchar("phone_number", { length: 30 }),
  status: varchar("status", { length: 30 }).notNull().default("disconnected"),
  qr_code: text("qr_code"),
  api_url: varchar("api_url", { length: 255 }),
  api_key: text("api_key"),
  is_active: boolean("is_active").notNull().default(true),
  last_connected_at: timestamp("last_connected_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
