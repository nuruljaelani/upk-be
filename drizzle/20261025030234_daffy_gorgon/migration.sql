CREATE TYPE "gender" AS ENUM('L', 'P');--> statement-breakpoint
CREATE TYPE "jenis_mutasi" AS ENUM('setor', 'tarik', 'bunga', 'koreksi');--> statement-breakpoint
CREATE TYPE "jenis_simpanan_type" AS ENUM('pokok', 'wajib', 'sukarela', 'berjangka');--> statement-breakpoint
CREATE TYPE "member_status" AS ENUM('pending', 'active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "metode_bayar" AS ENUM('tunai', 'transfer');--> statement-breakpoint
CREATE TYPE "metode_bunga" AS ENUM('flat', 'menurun', 'anuitas');--> statement-breakpoint
CREATE TYPE "rekening_status" AS ENUM('aktif', 'tutup', 'dibekukan');--> statement-breakpoint
CREATE TYPE "status_angsuran" AS ENUM('belum_bayar', 'sebagian', 'lunas', 'lewat_tempo');--> statement-breakpoint
CREATE TYPE "status_pinjaman" AS ENUM('diajukan', 'disetujui', 'ditolak', 'dicairkan', 'lunas', 'macet');--> statement-breakpoint
CREATE TABLE "berita_items" (
	"id" serial PRIMARY KEY,
	"judul" varchar(255) NOT NULL,
	"slug" varchar(255),
	"kategori" varchar(100) DEFAULT 'Umum',
	"tanggal" varchar(50),
	"excerpt" text,
	"konten" text,
	"gambar" text,
	"is_utama" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_content" (
	"id" serial PRIMARY KEY,
	"judul" text NOT NULL,
	"subjudul" text,
	"label_tombol" varchar(100) DEFAULT 'Aktivasi Akun',
	"href_tombol" varchar(255) DEFAULT '/aktivasi',
	"stat_anggota" varchar(50) DEFAULT '2000+',
	"stat_tahun" varchar(50) DEFAULT '20+',
	"stat_rating" varchar(50) DEFAULT '98%',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_angsuran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"pinjaman_id" uuid NOT NULL,
	"angsuran_ke" integer NOT NULL,
	"tanggal_jatuh_tempo" date NOT NULL,
	"pokok" numeric(15,2) NOT NULL,
	"bunga" numeric(15,2) NOT NULL,
	"total_angsuran" numeric(15,2) NOT NULL,
	"sisa_pokok" numeric(15,2) NOT NULL,
	"status_bayar" "status_angsuran" DEFAULT 'belum_bayar'::"status_angsuran" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jenis_pinjaman" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kode" varchar(20) NOT NULL UNIQUE,
	"nama" varchar(100) NOT NULL,
	"metode_bunga" "metode_bunga" DEFAULT 'flat'::"metode_bunga" NOT NULL,
	"suku_bunga_tahunan" numeric(5,2) NOT NULL,
	"tenor_min_bulan" integer DEFAULT 1 NOT NULL,
	"tenor_max_bulan" integer DEFAULT 60 NOT NULL,
	"plafon_min" numeric(15,2) DEFAULT '500000.00' NOT NULL,
	"plafon_max" numeric(15,2) DEFAULT '100000000.00' NOT NULL,
	"biaya_admin_persen" numeric(5,2) DEFAULT '1.00' NOT NULL,
	"deskripsi" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jenis_simpanan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kode" varchar(20) NOT NULL UNIQUE,
	"nama" varchar(100) NOT NULL,
	"tipe" "jenis_simpanan_type" NOT NULL,
	"minimal_setoran" numeric(15,2) DEFAULT '0.00' NOT NULL,
	"deskripsi" text,
	"is_wajib" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layanan_items" (
	"id" serial PRIMARY KEY,
	"judul" varchar(255) NOT NULL,
	"deskripsi" text NOT NULL,
	"warna_border" varchar(100) DEFAULT 'border-green-700',
	"warna_ikon" varchar(100) DEFAULT 'text-green-700',
	"urutan" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid UNIQUE,
	"no_anggota" varchar(30) NOT NULL UNIQUE,
	"nik" varchar(16) NOT NULL UNIQUE,
	"nama_lengkap" varchar(150) NOT NULL,
	"tempat_lahir" varchar(100),
	"tanggal_lahir" date,
	"jenis_kelamin" "gender" NOT NULL,
	"no_hp" varchar(20) NOT NULL,
	"alamat" text NOT NULL,
	"pekerjaan" varchar(100),
	"status_keanggotaan" "member_status" DEFAULT 'active'::"member_status" NOT NULL,
	"tanggal_bergabung" timestamp with time zone DEFAULT now() NOT NULL,
	"is_verified" boolean DEFAULT false,
	"foto_profil" text,
	"foto_ktp" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mutasi_simpanan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rekening_id" uuid NOT NULL,
	"operator_id" uuid,
	"kode_transaksi" varchar(40) NOT NULL UNIQUE,
	"jenis_mutasi" "jenis_mutasi" NOT NULL,
	"nominal" numeric(15,2) NOT NULL,
	"saldo_awal" numeric(15,2) NOT NULL,
	"saldo_akhir" numeric(15,2) NOT NULL,
	"keterangan" text,
	"metode_pembayaran" "metode_bayar" DEFAULT 'tunai'::"metode_bayar" NOT NULL,
	"bukti_pembayaran" text,
	"tanggal_transaksi" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp" (
	"id" bigserial PRIMARY KEY,
	"member_id" uuid,
	"identifier" varchar(20),
	"phone" varchar(20) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" bigserial PRIMARY KEY,
	"topic" varchar(100) NOT NULL,
	"event_key" varchar(100),
	"headers" jsonb,
	"payload" jsonb NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retry_count" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pembayaran_angsuran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"jadwal_angsuran_id" uuid NOT NULL,
	"pinjaman_id" uuid NOT NULL,
	"operator_id" uuid,
	"kode_pembayaran" varchar(40) NOT NULL UNIQUE,
	"nominal_bayar" numeric(15,2) NOT NULL,
	"denda" numeric(15,2) DEFAULT '0.00' NOT NULL,
	"tanggal_bayar" timestamp with time zone DEFAULT now() NOT NULL,
	"metode_pembayaran" varchar(30) DEFAULT 'tunai' NOT NULL,
	"bukti_pembayaran" text,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengajuan_pinjaman" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"member_id" uuid NOT NULL,
	"jenis_pinjaman_id" uuid NOT NULL,
	"nomor_pinjaman" varchar(35) NOT NULL UNIQUE,
	"jumlah_pinjaman" numeric(15,2) NOT NULL,
	"tenor_bulan" integer NOT NULL,
	"suku_bunga_tahunan" numeric(5,2) NOT NULL,
	"metode_bunga" "metode_bunga" NOT NULL,
	"total_bunga" numeric(15,2) DEFAULT '0.00' NOT NULL,
	"total_kewajiban" numeric(15,2) NOT NULL,
	"sisa_pokok" numeric(15,2) NOT NULL,
	"angsuran_per_bulan" numeric(15,2) NOT NULL,
	"biaya_admin" numeric(15,2) DEFAULT '0.00' NOT NULL,
	"tujuan_pinjaman" text,
	"dokumen_pendukung" text,
	"status" "status_pinjaman" DEFAULT 'diajukan'::"status_pinjaman" NOT NULL,
	"catatan_review" text,
	"reviewer_id" uuid,
	"tanggal_review" timestamp with time zone,
	"tanggal_pencairan" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rekening_simpanan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"member_id" uuid NOT NULL,
	"jenis_simpanan_id" uuid NOT NULL,
	"nomor_rekening" varchar(35) NOT NULL UNIQUE,
	"saldo" numeric(15,2) DEFAULT '0.00' NOT NULL,
	"status" "rekening_status" DEFAULT 'aktif'::"rekening_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY,
	"nama_organisasi" varchar(255) DEFAULT 'UPK Mekarsari' NOT NULL,
	"tagline" varchar(255) DEFAULT '',
	"deskripsi_singkat" text,
	"alamat" text,
	"telepon" varchar(50) DEFAULT '',
	"whatsapp" varchar(50) DEFAULT '',
	"email" varchar(100) DEFAULT '',
	"email_cs" varchar(100) DEFAULT '',
	"jam_operasional" varchar(100) DEFAULT '',
	"jam_sabtu" varchar(100) DEFAULT '',
	"facebook" varchar(255) DEFAULT '',
	"instagram" varchar(255) DEFAULT '',
	"youtube" varchar(255) DEFAULT '',
	"google_maps_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tentang_kami" (
	"id" serial PRIMARY KEY,
	"visi" text,
	"misi" jsonb,
	"deskripsi" text,
	"deskripsi_paragraf_2" text,
	"poin_keunggulan" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimoni_items" (
	"id" serial PRIMARY KEY,
	"nama" varchar(255) NOT NULL,
	"teks" text NOT NULL,
	"bintang" integer DEFAULT 5 NOT NULL,
	"jabatan" varchar(255) DEFAULT 'Anggota',
	"foto" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(50) NOT NULL UNIQUE,
	"phone" varchar(20) UNIQUE,
	"email" varchar(255) UNIQUE,
	"password_hash" text NOT NULL,
	"role" varchar(30) DEFAULT 'member' NOT NULL,
	"avatar" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"device_id" varchar(100) NOT NULL UNIQUE,
	"name" varchar(100) DEFAULT 'WhatsApp Notifikasi Utama' NOT NULL,
	"phone_number" varchar(30),
	"status" varchar(30) DEFAULT 'disconnected' NOT NULL,
	"qr_code" text,
	"api_url" varchar(255),
	"api_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_connected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jadwal_angsuran" ADD CONSTRAINT "jadwal_angsuran_pinjaman_id_pengajuan_pinjaman_id_fkey" FOREIGN KEY ("pinjaman_id") REFERENCES "pengajuan_pinjaman"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mutasi_simpanan" ADD CONSTRAINT "mutasi_simpanan_rekening_id_rekening_simpanan_id_fkey" FOREIGN KEY ("rekening_id") REFERENCES "rekening_simpanan"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mutasi_simpanan" ADD CONSTRAINT "mutasi_simpanan_operator_id_users_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "otp" ADD CONSTRAINT "otp_member_id_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pembayaran_angsuran" ADD CONSTRAINT "pembayaran_angsuran_jadwal_angsuran_id_jadwal_angsuran_id_fkey" FOREIGN KEY ("jadwal_angsuran_id") REFERENCES "jadwal_angsuran"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pembayaran_angsuran" ADD CONSTRAINT "pembayaran_angsuran_pinjaman_id_pengajuan_pinjaman_id_fkey" FOREIGN KEY ("pinjaman_id") REFERENCES "pengajuan_pinjaman"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pembayaran_angsuran" ADD CONSTRAINT "pembayaran_angsuran_operator_id_users_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "pengajuan_pinjaman" ADD CONSTRAINT "pengajuan_pinjaman_member_id_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pengajuan_pinjaman" ADD CONSTRAINT "pengajuan_pinjaman_jenis_pinjaman_id_jenis_pinjaman_id_fkey" FOREIGN KEY ("jenis_pinjaman_id") REFERENCES "jenis_pinjaman"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "pengajuan_pinjaman" ADD CONSTRAINT "pengajuan_pinjaman_reviewer_id_users_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "rekening_simpanan" ADD CONSTRAINT "rekening_simpanan_member_id_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rekening_simpanan" ADD CONSTRAINT "rekening_simpanan_jenis_simpanan_id_jenis_simpanan_id_fkey" FOREIGN KEY ("jenis_simpanan_id") REFERENCES "jenis_simpanan"("id") ON DELETE RESTRICT;