import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, numeric, integer, date } from "drizzle-orm/pg-core";
import { members } from "./members.js";
import { users } from "./users.js";

export const metodeBungaEnum = pgEnum("metode_bunga", [
  "flat",
  "menurun",
  "anuitas",
]);

export const statusPinjamanEnum = pgEnum("status_pinjaman", [
  "diajukan",
  "disetujui",
  "ditolak",
  "dicairkan",
  "lunas",
  "macet",
]);

export const statusAngsuranEnum = pgEnum("status_angsuran", [
  "belum_bayar",
  "sebagian",
  "lunas",
  "lewat_tempo",
]);

// Master Jenis Pinjaman
export const jenisPinjaman = pgTable("jenis_pinjaman", {
  id: uuid("id").primaryKey().defaultRandom(),
  kode: varchar("kode", { length: 20 }).notNull().unique(),
  nama: varchar("nama", { length: 100 }).notNull(),
  metode_bunga: metodeBungaEnum("metode_bunga").notNull().default("flat"),
  suku_bunga_tahunan: numeric("suku_bunga_tahunan", { precision: 5, scale: 2 }).notNull(),
  tenor_min_bulan: integer("tenor_min_bulan").notNull().default(1),
  tenor_max_bulan: integer("tenor_max_bulan").notNull().default(60),
  plafon_min: numeric("plafon_min", { precision: 15, scale: 2 })
    .notNull()
    .default("500000.00"),
  plafon_max: numeric("plafon_max", { precision: 15, scale: 2 })
    .notNull()
    .default("100000000.00"),
  biaya_admin_persen: numeric("biaya_admin_persen", { precision: 5, scale: 2 })
    .notNull()
    .default("1.00"),
  deskripsi: text("deskripsi"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Transaksi Pengajuan Pinjaman
export const pengajuanPinjaman = pgTable("pengajuan_pinjaman", {
  id: uuid("id").primaryKey().defaultRandom(),
  member_id: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  jenis_pinjaman_id: uuid("jenis_pinjaman_id")
    .notNull()
    .references(() => jenisPinjaman.id, { onDelete: "restrict" }),
  nomor_pinjaman: varchar("nomor_pinjaman", { length: 35 }).notNull().unique(),
  jumlah_pinjaman: numeric("jumlah_pinjaman", { precision: 15, scale: 2 }).notNull(),
  tenor_bulan: integer("tenor_bulan").notNull(),
  suku_bunga_tahunan: numeric("suku_bunga_tahunan", { precision: 5, scale: 2 }).notNull(),
  metode_bunga: metodeBungaEnum("metode_bunga").notNull(),
  total_bunga: numeric("total_bunga", { precision: 15, scale: 2 }).notNull().default("0.00"),
  total_kewajiban: numeric("total_kewajiban", { precision: 15, scale: 2 }).notNull(),
  sisa_pokok: numeric("sisa_pokok", { precision: 15, scale: 2 }).notNull(),
  angsuran_per_bulan: numeric("angsuran_per_bulan", { precision: 15, scale: 2 }).notNull(),
  biaya_admin: numeric("biaya_admin", { precision: 15, scale: 2 }).notNull().default("0.00"),
  tujuan_pinjaman: text("tujuan_pinjaman"),
  dokumen_pendukung: text("dokumen_pendukung"),
  status: statusPinjamanEnum("status").notNull().default("diajukan"),
  catatan_review: text("catatan_review"),
  reviewer_id: uuid("reviewer_id")
    .references(() => users.id, { onDelete: "set null" }),
  tanggal_review: timestamp("tanggal_review", { withTimezone: true }),
  tanggal_pencairan: timestamp("tanggal_pencairan", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Jadwal Angsuran Per Bulan
export const jadwalAngsuran = pgTable("jadwal_angsuran", {
  id: uuid("id").primaryKey().defaultRandom(),
  pinjaman_id: uuid("pinjaman_id")
    .notNull()
    .references(() => pengajuanPinjaman.id, { onDelete: "cascade" }),
  angsuran_ke: integer("angsuran_ke").notNull(),
  tanggal_jatuh_tempo: date("tanggal_jatuh_tempo").notNull(),
  pokok: numeric("pokok", { precision: 15, scale: 2 }).notNull(),
  bunga: numeric("bunga", { precision: 15, scale: 2 }).notNull(),
  total_angsuran: numeric("total_angsuran", { precision: 15, scale: 2 }).notNull(),
  sisa_pokok: numeric("sisa_pokok", { precision: 15, scale: 2 }).notNull(),
  status_bayar: statusAngsuranEnum("status_bayar").notNull().default("belum_bayar"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Riwayat Pembayaran Angsuran
export const pembayaranAngsuran = pgTable("pembayaran_angsuran", {
  id: uuid("id").primaryKey().defaultRandom(),
  jadwal_angsuran_id: uuid("jadwal_angsuran_id")
    .notNull()
    .references(() => jadwalAngsuran.id, { onDelete: "cascade" }),
  pinjaman_id: uuid("pinjaman_id")
    .notNull()
    .references(() => pengajuanPinjaman.id, { onDelete: "cascade" }),
  operator_id: uuid("operator_id")
    .references(() => users.id, { onDelete: "set null" }),
  kode_pembayaran: varchar("kode_pembayaran", { length: 40 }).notNull().unique(),
  nominal_bayar: numeric("nominal_bayar", { precision: 15, scale: 2 }).notNull(),
  denda: numeric("denda", { precision: 15, scale: 2 }).notNull().default("0.00"),
  tanggal_bayar: timestamp("tanggal_bayar", { withTimezone: true }).notNull().defaultNow(),
  metode_pembayaran: varchar("metode_pembayaran", { length: 30 }).notNull().default("tunai"),
  bukti_pembayaran: text("bukti_pembayaran"),
  catatan: text("catatan"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
