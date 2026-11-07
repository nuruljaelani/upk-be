import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * 1. Profil & Legalitas Koperasi
 * Menyimpan identitas organisasi, legalitas hukum, kontak resmi, dan rekening perbankan.
 */
export const profilKoperasi = pgTable("profil_koperasi", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 255 })
    .notNull()
    .default("Unit Pengelola Kegiatan Mekarsari"),
  singkatan: varchar("singkatan", { length: 50 })
    .notNull()
    .default("UPK Mekarsari"),
  tagline: varchar("tagline", { length: 255 }).default(
    "Bersama Menuju Kesejahteraan"
  ),
  alamat: text("alamat").default("Jl. Mekarsari No. 12 RT 03 RW 05"),
  kota: varchar("kota", { length: 100 }).default("Bandung"),
  provinsi: varchar("provinsi", { length: 100 }).default("Jawa Barat"),
  kode_pos: varchar("kode_pos", { length: 10 }).default("40123"),
  no_telp: varchar("no_telp", { length: 50 }).default("022-5678901"),
  email: varchar("email", { length: 100 }).default("info@upkmekarsari.co.id"),
  website: varchar("website", { length: 255 }).default("https://upkmekarsari.co.id"),
  no_sk: varchar("no_sk", { length: 100 }).default("SK/BH/PAD/XVI/IV/2010"),
  tanggal_berdiri: varchar("tanggal_berdiri", { length: 50 }).default("2010-04-15"),
  npwp: varchar("npwp", { length: 50 }).default("12.345.678.9-012.000"),
  bank_nama: varchar("bank_nama", { length: 100 }).default("Bank BRI"),
  bank_no_rekening: varchar("bank_no_rekening", { length: 50 }).default("1234-5678-9012"),
  bank_atas_nama: varchar("bank_atas_nama", { length: 150 }).default("UPK Mekarsari"),
  logo_url: text("logo_url"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * 2. Pengaturan Notifikasi (Email SMTP & WhatsApp Gateway)
 * Menyimpan konfigurasi server pengiriman pesan dan template otomatis notifikasi.
 */
export const pengaturanNotifikasi = pgTable("pengaturan_notifikasi", {
  id: serial("id").primaryKey(),

  // Konfigurasi Email SMTP
  email_aktif: boolean("email_aktif").default(false).notNull(),
  email_host: varchar("email_host", { length: 150 }).default("smtp.gmail.com"),
  email_port: varchar("email_port", { length: 10 }).default("587"),
  email_user: varchar("email_user", { length: 150 }).default(""),
  email_password: text("email_password").default(""),
  email_pengirim: varchar("email_pengirim", { length: 150 }).default(
    "noreply@upkmekarsari.co.id"
  ),
  nama_pengirim: varchar("nama_pengirim", { length: 150 }).default("UPK Mekarsari"),
  email_ssl: boolean("email_ssl").default(true).notNull(),

  // Template Pesan Email
  template_pengajuan: text("template_pengajuan").default(
    "Yth. {nama_anggota},\n\nPengajuan pinjaman Anda sebesar {jumlah} telah kami terima dan sedang dalam proses review.\n\nTerima kasih.\nUPK Mekarsari"
  ),
  template_disetujui: text("template_disetujui").default(
    "Yth. {nama_anggota},\n\nSelamat! Pengajuan pinjaman Anda sebesar {jumlah} telah DISETUJUI.\n\nSilakan hubungi kami untuk proses pencairan.\n\nTerima kasih.\nUPK Mekarsari"
  ),
  template_ditolak: text("template_ditolak").default(
    "Yth. {nama_anggota},\n\nMohon maaf, pengajuan pinjaman Anda tidak dapat kami proses saat ini.\n\nSilakan hubungi pengurus untuk informasi lebih lanjut.\n\nTerima kasih.\nUPK Mekarsari"
  ),

  // Konfigurasi WhatsApp Gateway
  whatsapp_aktif: boolean("whatsapp_aktif").default(false).notNull(),
  whatsapp_provider: varchar("whatsapp_provider", { length: 50 }).default("fonnte"),
  whatsapp_api_key: text("whatsapp_api_key").default(""),
  whatsapp_nomor_pengirim: varchar("whatsapp_nomor_pengirim", { length: 50 }).default(""),
  whatsapp_nomor_admin: varchar("whatsapp_nomor_admin", { length: 50 }).default(""),

  // Template Pesan WhatsApp
  template_wa_pengajuan: text("template_wa_pengajuan").default(
    "Halo {nama_anggota}, pengajuan pinjaman Rp {jumlah} Anda telah diterima dan sedang diproses. - UPK Mekarsari"
  ),
  template_wa_status: text("template_wa_status").default(
    "Halo {nama_anggota}, status pinjaman Anda telah diperbarui menjadi *{status}*. Hubungi kami untuk informasi lebih lanjut. - UPK Mekarsari"
  ),
  template_wa_jatuh_tempo: text("template_wa_jatuh_tempo").default(
    "Halo {nama_anggota}, ini adalah pengingat bahwa angsuran pinjaman Anda senilai Rp {jumlah_angsuran} akan jatuh tempo pada {tanggal_jatuh_tempo}. - UPK Mekarsari"
  ),

  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * 3. Pengaturan Keamanan Sistem
 * Menyimpan konfigurasi batas durasi sesi, proteksi brute-force login, dan audit logging.
 */
export const pengaturanKeamanan = pgTable("pengaturan_keamanan", {
  id: serial("id").primaryKey(),
  session_timeout: integer("session_timeout").default(60).notNull(), // Satuan menit
  max_login_attempts: integer("max_login_attempts").default(5).notNull(),
  log_aktivitas: boolean("log_aktivitas").default(true).notNull(),
  mfa_enabled: boolean("mfa_enabled").default(false).notNull(),
  password_min_length: integer("password_min_length").default(8).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * 4. Pengaturan Laporan & Backup
 * Menyimpan format default unduhan, jadwal automasi pencadangan data, dan retensi data.
 */
export const pengaturanLaporan = pgTable("pengaturan_laporan", {
  id: serial("id").primaryKey(),
  format_default: varchar("format_default", { length: 20 })
    .default("excel")
    .notNull(), // 'excel' | 'pdf'
  jadwal_backup: varchar("jadwal_backup", { length: 30 })
    .default("harian")
    .notNull(), // 'harian' | 'mingguan' | 'bulanan'
  retensi_backup: integer("retensi_backup").default(30).notNull(), // Satuan hari
  auto_backup: boolean("auto_backup").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
