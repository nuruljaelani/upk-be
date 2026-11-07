import { pgTable, uuid, varchar, text, timestamp, pgEnum, date, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const memberStatusEnum = pgEnum("member_status", [
  "pending",
  "active",
  "inactive",
  "suspended",
]);

export const genderEnum = pgEnum("gender", ["L", "P"]);

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique(), // Nullable: Anggota eksisting dari buku koperasi lama belum memiliki akun login sebelum aktivasi
  no_anggota: varchar("no_anggota", { length: 30 }).notNull().unique(),
  nik: varchar("nik", { length: 16 }).notNull().unique(),
  nama_lengkap: varchar("nama_lengkap", { length: 150 }).notNull(),
  tempat_lahir: varchar("tempat_lahir", { length: 100 }),
  tanggal_lahir: date("tanggal_lahir"),
  jenis_kelamin: genderEnum("jenis_kelamin").notNull(),
  no_hp: varchar("no_hp", { length: 20 }).notNull(),
  alamat: text("alamat").notNull(),
  pekerjaan: varchar("pekerjaan", { length: 100 }),
  status_keanggotaan: memberStatusEnum("status_keanggotaan")
    .notNull()
    .default("active"), // Anggota lama umumnya berstatus active
  tanggal_bergabung: timestamp("tanggal_bergabung", { withTimezone: true })
    .notNull()
    .defaultNow(),
  is_verified: boolean("is_verified").default(false),
  foto_profil: text("foto_profil"),
  foto_ktp: text("foto_ktp"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
