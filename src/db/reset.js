import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { execSync } from "child_process";

async function resetDatabase() {
  console.log("⚠️  Memulai proses reset database PostgreSQL...");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di file .env!");
    process.exit(1);
  }

  try {
    const sql = neon(databaseUrl);

    // 1. Drop dan recreate schema public & drizzle
    console.log("🗑️  Menghapus schema lama ('public' & 'drizzle')...");
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    console.log("✅ Database fisik berhasil dikosongkan.");

    // 2. Jalankan migrasi schema terbaru
    console.log("\n📦 Menjalankan migrasi Drizzle (drizzle-kit migrate)...");
    execSync("bunx drizzle-kit migrate", { stdio: "inherit" });

    // 3. Jalankan seeding data testing otomatis
    console.log("\n🌱 Mengisi kembali data testing (db:seed)...");
    execSync("bun run db:seed", { stdio: "inherit" });

    console.log("\n🎉 Database sukses di-reset, dimigrasi, dan di-seed dengan bersih!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Gagal mereset database:", error);
    process.exit(1);
  }
}

resetDatabase();
