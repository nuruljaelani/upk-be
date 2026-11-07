import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";
import { members } from "./members.js";
import { users } from "./users.js";

export const jenisSimpananEnum = pgEnum("jenis_simpanan_type", [
  "pokok",
  "wajib",
  "sukarela",
  "berjangka",
]);

export const rekeningStatusEnum = pgEnum("rekening_status", [
  "aktif",
  "tutup",
  "dibekukan",
]);

export const jenisMutasiEnum = pgEnum("jenis_mutasi", [
  "setor",
  "tarik",
  "bunga",
  "koreksi",
]);

export const metodeBayarEnum = pgEnum("metode_bayar", [
  "tunai",
  "transfer",
]);

// Master Jenis Simpanan (Pokok, Wajib, Sukarela, dll.)
export const jenisSimpanan = pgTable("jenis_simpanan", {
  id: uuid("id").primaryKey().defaultRandom(),
  kode: varchar("kode", { length: 20 }).notNull().unique(),
  nama: varchar("nama", { length: 100 }).notNull(),
  tipe: jenisSimpananEnum("tipe").notNull(),
  minimal_setoran: numeric("minimal_setoran", { precision: 15, scale: 2 })
    .notNull()
    .default("0.00"),
  deskripsi: text("deskripsi"),
  is_wajib: boolean("is_wajib").notNull().default(false),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Rekening Simpanan Anggota
export const rekeningSimpanan = pgTable("rekening_simpanan", {
  id: uuid("id").primaryKey().defaultRandom(),
  member_id: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  jenis_simpanan_id: uuid("jenis_simpanan_id")
    .notNull()
    .references(() => jenisSimpanan.id, { onDelete: "restrict" }),
  nomor_rekening: varchar("nomor_rekening", { length: 35 }).notNull().unique(),
  saldo: numeric("saldo", { precision: 15, scale: 2 }).notNull().default("0.00"),
  status: rekeningStatusEnum("status").notNull().default("aktif"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Mutasi / Riwayat Transaksi Simpanan
export const mutasiSimpanan = pgTable("mutasi_simpanan", {
  id: uuid("id").primaryKey().defaultRandom(),
  rekening_id: uuid("rekening_id")
    .notNull()
    .references(() => rekeningSimpanan.id, { onDelete: "cascade" }),
  operator_id: uuid("operator_id")
    .references(() => users.id, { onDelete: "set null" }),
  kode_transaksi: varchar("kode_transaksi", { length: 40 }).notNull().unique(),
  jenis_mutasi: jenisMutasiEnum("jenis_mutasi").notNull(),
  nominal: numeric("nominal", { precision: 15, scale: 2 }).notNull(),
  saldo_awal: numeric("saldo_awal", { precision: 15, scale: 2 }).notNull(),
  saldo_akhir: numeric("saldo_akhir", { precision: 15, scale: 2 }).notNull(),
  keterangan: text("keterangan"),
  metode_pembayaran: metodeBayarEnum("metode_pembayaran").notNull().default("tunai"),
  bukti_pembayaran: text("bukti_pembayaran"),
  tanggal_transaksi: timestamp("tanggal_transaksi", { withTimezone: true })
    .notNull()
    .defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
