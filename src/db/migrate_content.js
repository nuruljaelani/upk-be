import { db } from "./index.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("🚀 Menjalankan migrasi tabel Konten CMS & Situs...");

  // 1. site_settings
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
      nama_organisasi VARCHAR(255) NOT NULL DEFAULT 'UPK Mekarsari',
      tagline VARCHAR(255) DEFAULT '',
      deskripsi_singkat TEXT,
      alamat TEXT,
      telepon VARCHAR(50) DEFAULT '',
      whatsapp VARCHAR(50) DEFAULT '',
      email VARCHAR(100) DEFAULT '',
      email_cs VARCHAR(100) DEFAULT '',
      jam_operasional VARCHAR(100) DEFAULT '',
      jam_sabtu VARCHAR(100) DEFAULT '',
      facebook VARCHAR(255) DEFAULT '',
      instagram VARCHAR(255) DEFAULT '',
      youtube VARCHAR(255) DEFAULT '',
      google_maps_url TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // 2. hero_content
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS hero_content (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
      judul TEXT NOT NULL,
      subjudul TEXT,
      label_tombol VARCHAR(100) DEFAULT 'Aktivasi Akun',
      href_tombol VARCHAR(255) DEFAULT '/aktivasi',
      stat_anggota VARCHAR(50) DEFAULT '2000+',
      stat_tahun VARCHAR(50) DEFAULT '20+',
      stat_rating VARCHAR(50) DEFAULT '98%',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // 3. layanan_items
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS layanan_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      judul VARCHAR(255) NOT NULL,
      deskripsi TEXT NOT NULL,
      warna_border VARCHAR(100) DEFAULT 'border-green-700',
      warna_ikon VARCHAR(100) DEFAULT 'text-green-700',
      urutan INT DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // 4. berita_items
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS berita_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      judul VARCHAR(255) NOT NULL,
      slug VARCHAR(255),
      kategori VARCHAR(100) DEFAULT 'Umum',
      tanggal VARCHAR(50),
      excerpt TEXT,
      konten TEXT,
      gambar TEXT,
      is_utama BOOLEAN NOT NULL DEFAULT false,
      status VARCHAR(50) NOT NULL DEFAULT 'published',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // 5. tentang_kami
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tentang_kami (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
      visi TEXT,
      misi JSONB,
      deskripsi TEXT,
      deskripsi_paragraf_2 TEXT,
      poin_keunggulan JSONB,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // 6. testimoni_items
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS testimoni_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nama VARCHAR(255) NOT NULL,
      teks TEXT NOT NULL,
      bintang INT NOT NULL DEFAULT 5,
      jabatan VARCHAR(255) DEFAULT 'Anggota',
      foto TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  console.log("✅ Berhasil membuat seluruh tabel Konten CMS!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Gagal migrasi konten:", err);
  process.exit(1);
});
