import { pgTable, varchar, timestamp, bigserial, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { members } from "./members.js";

export const otp = pgTable("otp", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  member_id: uuid("member_id")
    .references(() => members.id, { onDelete: "cascade" }),
  identifier: varchar("identifier", { length: 20 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});