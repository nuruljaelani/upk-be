CREATE TABLE "pengaturan_keamanan" (
	"id" serial PRIMARY KEY,
	"session_timeout" integer DEFAULT 60 NOT NULL,
	"max_login_attempts" integer DEFAULT 5 NOT NULL,
	"log_aktivitas" boolean DEFAULT true NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"password_min_length" integer DEFAULT 8 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengaturan_laporan" (
	"id" serial PRIMARY KEY,
	"format_default" varchar(20) DEFAULT 'excel' NOT NULL,
	"jadwal_backup" varchar(30) DEFAULT 'harian' NOT NULL,
	"retensi_backup" integer DEFAULT 30 NOT NULL,
	"auto_backup" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengaturan_notifikasi" (
	"id" serial PRIMARY KEY,
	"email_aktif" boolean DEFAULT false NOT NULL,
	"email_host" varchar(150) DEFAULT 'smtp.gmail.com',
	"email_port" varchar(10) DEFAULT '587',
	"email_user" varchar(150) DEFAULT '',
	"email_password" text DEFAULT '',
	"email_pengirim" varchar(150) DEFAULT 'noreply@upkmekarsari.co.id',
	"nama_pengirim" varchar(150) DEFAULT 'UPK Mekarsari',
	"email_ssl" boolean DEFAULT true NOT NULL,
	"template_pengajuan" text DEFAULT 'Yth. {nama_anggota},

Pengajuan pinjaman Anda sebesar {jumlah} telah kami terima dan sedang dalam proses review.

Terima kasih.
UPK Mekarsari',
	"template_disetujui" text DEFAULT 'Yth. {nama_anggota},

Selamat! Pengajuan pinjaman Anda sebesar {jumlah} telah DISETUJUI.

Silakan hubungi kami untuk proses pencairan.

Terima kasih.
UPK Mekarsari',
	"template_ditolak" text DEFAULT 'Yth. {nama_anggota},

Mohon maaf, pengajuan pinjaman Anda tidak dapat kami proses saat ini.

Silakan hubungi pengurus untuk informasi lebih lanjut.

Terima kasih.
UPK Mekarsari',
	"whatsapp_aktif" boolean DEFAULT false NOT NULL,
	"whatsapp_provider" varchar(50) DEFAULT 'fonnte',
	"whatsapp_api_key" text DEFAULT '',
	"whatsapp_nomor_pengirim" varchar(50) DEFAULT '',
	"whatsapp_nomor_admin" varchar(50) DEFAULT '',
	"template_wa_pengajuan" text DEFAULT 'Halo {nama_anggota}, pengajuan pinjaman Rp {jumlah} Anda telah diterima dan sedang diproses. - UPK Mekarsari',
	"template_wa_status" text DEFAULT 'Halo {nama_anggota}, status pinjaman Anda telah diperbarui menjadi *{status}*. Hubungi kami untuk informasi lebih lanjut. - UPK Mekarsari',
	"template_wa_jatuh_tempo" text DEFAULT 'Halo {nama_anggota}, ini adalah pengingat bahwa angsuran pinjaman Anda senilai Rp {jumlah_angsuran} akan jatuh tempo pada {tanggal_jatuh_tempo}. - UPK Mekarsari',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profil_koperasi" (
	"id" serial PRIMARY KEY,
	"nama" varchar(255) DEFAULT 'Unit Pengelola Kegiatan Mekarsari' NOT NULL,
	"singkatan" varchar(50) DEFAULT 'UPK Mekarsari' NOT NULL,
	"tagline" varchar(255) DEFAULT 'Bersama Menuju Kesejahteraan',
	"alamat" text DEFAULT 'Jl. Mekarsari No. 12 RT 03 RW 05',
	"kota" varchar(100) DEFAULT 'Bandung',
	"provinsi" varchar(100) DEFAULT 'Jawa Barat',
	"kode_pos" varchar(10) DEFAULT '40123',
	"no_telp" varchar(50) DEFAULT '022-5678901',
	"email" varchar(100) DEFAULT 'info@upkmekarsari.co.id',
	"website" varchar(255) DEFAULT 'https://upkmekarsari.co.id',
	"no_sk" varchar(100) DEFAULT 'SK/BH/PAD/XVI/IV/2010',
	"tanggal_berdiri" varchar(50) DEFAULT '2010-04-15',
	"npwp" varchar(50) DEFAULT '12.345.678.9-012.000',
	"bank_nama" varchar(100) DEFAULT 'Bank BRI',
	"bank_no_rekening" varchar(50) DEFAULT '1234-5678-9012',
	"bank_atas_nama" varchar(150) DEFAULT 'UPK Mekarsari',
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
