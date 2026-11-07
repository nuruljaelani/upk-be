import { pgTable, varchar, text, boolean, timestamp, integer, jsonb, serial } from "drizzle-orm/pg-core";

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  nama_organisasi: varchar("nama_organisasi", { length: 255 }).notNull().default("UPK Mekarsari"),
  tagline: varchar("tagline", { length: 255 }).default(""),
  deskripsi_singkat: text("deskripsi_singkat"),
  alamat: text("alamat"),
  telepon: varchar("telepon", { length: 50 }).default(""),
  whatsapp: varchar("whatsapp", { length: 50 }).default(""),
  email: varchar("email", { length: 100 }).default(""),
  email_cs: varchar("email_cs", { length: 100 }).default(""),
  jam_operasional: varchar("jam_operasional", { length: 100 }).default(""),
  jam_sabtu: varchar("jam_sabtu", { length: 100 }).default(""),
  facebook: varchar("facebook", { length: 255 }).default(""),
  instagram: varchar("instagram", { length: 255 }).default(""),
  youtube: varchar("youtube", { length: 255 }).default(""),
  google_maps_url: text("google_maps_url"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const heroContent = pgTable("hero_content", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  subjudul: text("subjudul"),
  label_tombol: varchar("label_tombol", { length: 100 }).default("Aktivasi Akun"),
  href_tombol: varchar("href_tombol", { length: 255 }).default("/aktivasi"),
  stat_anggota: varchar("stat_anggota", { length: 50 }).default("2000+"),
  stat_tahun: varchar("stat_tahun", { length: 50 }).default("20+"),
  stat_rating: varchar("stat_rating", { length: 50 }).default("98%"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const layananItems = pgTable("layanan_items", {
  id: serial("id").primaryKey(),
  judul: varchar("judul", { length: 255 }).notNull(),
  deskripsi: text("deskripsi").notNull(),
  warna_border: varchar("warna_border", { length: 100 }).default("border-green-700"),
  warna_ikon: varchar("warna_ikon", { length: 100 }).default("text-green-700"),
  urutan: integer("urutan").default(0),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const beritaItems = pgTable("berita_items", {
  id: serial("id").primaryKey(),
  judul: varchar("judul", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  kategori: varchar("kategori", { length: 100 }).default("Umum"),
  tanggal: varchar("tanggal", { length: 50 }),
  excerpt: text("excerpt"),
  konten: text("konten"),
  gambar: text("gambar"),
  is_utama: boolean("is_utama").default(false).notNull(),
  status: varchar("status", { length: 50 }).default("published").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const tentangKami = pgTable("tentang_kami", {
  id: serial("id").primaryKey(),
  visi: text("visi"),
  misi: jsonb("misi"),
  deskripsi: text("deskripsi"),
  deskripsi_paragraf_2: text("deskripsi_paragraf_2"),
  poin_keunggulan: jsonb("poin_keunggulan"),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const testimoniItems = pgTable("testimoni_items", {
  id: serial("id").primaryKey(),
  nama: varchar("nama", { length: 255 }).notNull(),
  teks: text("teks").notNull(),
  bintang: integer("bintang").default(5).notNull(),
  jabatan: varchar("jabatan", { length: 255 }).default("Anggota"),
  foto: text("foto"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
