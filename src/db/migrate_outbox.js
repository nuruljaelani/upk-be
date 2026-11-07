import { db } from "./index.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("🚀 Menjalankan pengecekan dan migrasi tabel outbox & wa_devices...");

  // 1. wa_devices
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS wa_devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL DEFAULT 'WhatsApp Notifikasi Utama',
      phone_number VARCHAR(30),
      status VARCHAR(30) NOT NULL DEFAULT 'disconnected',
      qr_code TEXT,
      api_url VARCHAR(255),
      api_key TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_connected_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 2. outbox
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS outbox (
      id BIGSERIAL PRIMARY KEY,
      topic VARCHAR(100) NOT NULL,
      event_key VARCHAR(100),
      headers JSONB,
      payload JSONB NOT NULL,
      retry_count INT NOT NULL DEFAULT 0,
      max_retry_count INT NOT NULL DEFAULT 3,
      last_error TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Indexes for high performance queue polling
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON outbox (status, created_at);
  `);

  console.log("✅ Tabel outbox dan wa_devices siap digunakan!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Gagal migrasi outbox:", err);
  process.exit(1);
});
