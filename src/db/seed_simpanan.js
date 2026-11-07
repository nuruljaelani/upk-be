import "dotenv/config";
import { db } from "./index.js";
import { jenisSimpanan } from "./schema/simpanan.js";
import { eq } from "drizzle-orm";

async function seedJenisSimpanan() {
  console.log("🌱 Memeriksa dan seeding Master Jenis Simpanan...");

  const defaultJenis = [
    {
      kode: "SP",
      nama: "Simpanan Pokok",
      tipe: "pokok",
      minimal_setoran: "100000.00",
      deskripsi: "Simpanan pokok yang dibayarkan satu kali saat mendaftar menjadi anggota koperasi.",
      is_wajib: true,
      is_active: true,
    },
    {
      kode: "SW",
      nama: "Simpanan Wajib",
      tipe: "wajib",
      minimal_setoran: "25000.00",
      deskripsi: "Simpanan wajib yang disetorkan setiap bulan oleh anggota aktif.",
      is_wajib: true,
      is_active: true,
    },
    {
      kode: "SS",
      nama: "Simpanan Sukarela",
      tipe: "sukarela",
      minimal_setoran: "10000.00",
      deskripsi: "Simpanan sukarela yang dapat disetor dan ditarik sewaktu-waktu.",
      is_wajib: false,
      is_active: true,
    },
  ];

  for (const item of defaultJenis) {
    const existing = await db
      .select({ id: jenisSimpanan.id, kode: jenisSimpanan.kode })
      .from(jenisSimpanan)
      .where(eq(jenisSimpanan.kode, item.kode))
      .limit(1);

    if (existing.length === 0) {
      const [created] = await db.insert(jenisSimpanan).values(item).returning();
      console.log(`✅ Berhasil menambahkan jenis simpanan: ${created.nama} (${created.kode})`);
    } else {
      console.log(`ℹ️ Jenis simpanan ${item.kode} sudah ada.`);
    }
  }

  console.log("✨ Seeding Master Jenis Simpanan selesai!");
  process.exit(0);
}

seedJenisSimpanan().catch((err) => {
  console.error("❌ Gagal seeding jenis simpanan:", err);
  process.exit(1);
});
