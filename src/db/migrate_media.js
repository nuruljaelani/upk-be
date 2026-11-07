import { db } from "./index.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("🚀 Menambahkan kolom foto_profil, foto_ktp, dan dokumen_pendukung...");
  await db.execute(sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS foto_profil text;`);
  await db.execute(sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS foto_ktp text;`);
  await db.execute(sql`ALTER TABLE pengajuan_pinjaman ADD COLUMN IF NOT EXISTS dokumen_pendukung text;`);
  console.log("✅ Berhasil menambahkan kolom media!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Gagal migrasi:", err);
  process.exit(1);
});
