import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  email: varchar("email", { length: 255 }).unique(), // Nullable: data anggota lama tidak memiliki email
  password_hash: text("password_hash").notNull(),
  role: varchar("role", { length: 30 }).notNull().default("member"),
  avatar: varchar("avatar", { length: 255 }),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
