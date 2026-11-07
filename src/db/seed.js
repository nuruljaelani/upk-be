import "dotenv/config";
import { db } from "./index.js";
import { users } from "./schema/users.js";
import { members } from "./schema/members.js";
import { hashPassword } from "../utils/auth.js";
import { inArray, or } from "drizzle-orm";

async function seed() {
  console.log("🌱 Menjalankan seeding data User & Member...");

  try {
    const seedNiks = [
      "3201011205800001", // Superadmin
      "3201015508920002", // Member Aktif
      "3201012010880003", // Member Belum Aktivasi
    ];

    const seedPhones = [
      "081234567890",
      "081298765432",
      "085712345678",
    ];

    const seedUsernames = [
      "superadmin",
      "siti_aminah",
    ];

    // 1. Bersihkan data seed sebelumnya jika ada (Idempotent)
    console.log("🧹 Membersihkan data seed lama jika ada...");
    await db.delete(members).where(inArray(members.nik, seedNiks));
    await db.delete(users).where(
      or(
        inArray(users.phone, seedPhones),
        inArray(users.username, seedUsernames)
      )
    );

    // 2. Hash password default
    const adminPasswordHash = await hashPassword("admin123");
    const memberPasswordHash = await hashPassword("member123");

    // ==========================================
    // DATA 1: Super Admin / Pengurus Koperasi
    // ==========================================
    console.log("👤 Membuat Data 1: Super Admin (Pengurus)...");
    const [adminUser] = await db
      .insert(users)
      .values({
        username: "superadmin",
        phone: "081234567890",
        email: "admin@koperasi.id",
        password_hash: adminPasswordHash,
        role: "superadmin",
        is_active: true,
      })
      .returning();

    const [adminMember] = await db
      .insert(members)
      .values({
        user_id: adminUser.id,
        no_anggota: "KOP-2024-0001",
        nik: "3201011205800001",
        nama_lengkap: "Budi Santoso, S.E.",
        tempat_lahir: "Bogor",
        tanggal_lahir: "1980-05-12",
        jenis_kelamin: "L",
        no_hp: "081234567890",
        alamat: "Jl. Raya Pajajaran No. 10, Bogor",
        pekerjaan: "Pengurus Koperasi",
        status_keanggotaan: "active",
      })
      .returning();

    // ==========================================
    // DATA 2: Member Aktif (Sudah Memiliki Akun Login)
    // ==========================================
    console.log("👤 Membuat Data 2: Member Aktif (Sudah Aktivasi)...");
    const [memberUser] = await db
      .insert(users)
      .values({
        username: "siti_aminah",
        phone: "081298765432",
        email: "siti.aminah@gmail.com",
        password_hash: memberPasswordHash,
        role: "member",
        is_active: true,
      })
      .returning();

    const [activeMember] = await db
      .insert(members)
      .values({
        user_id: memberUser.id,
        no_anggota: "KOP-2025-0102",
        nik: "3201015508920002",
        nama_lengkap: "Siti Aminah",
        tempat_lahir: "Jakarta",
        tanggal_lahir: "1992-08-15",
        jenis_kelamin: "P",
        no_hp: "081298765432",
        alamat: "Jl. Merdeka No. 45, Jakarta Selatan",
        pekerjaan: "Wiraswasta",
        status_keanggotaan: "active",
      })
      .returning();

    // ==========================================
    // DATA 3: Member Lama (Belum Aktivasi / user_id: null)
    // ==========================================
    console.log("👤 Membuat Data 3: Member Lama (Belum Aktivasi Akun)...");
    const [unactivatedMember] = await db
      .insert(members)
      .values({
        user_id: null, // Belum terhubung ke tabel users
        no_anggota: "KOP-2023-0088",
        nik: "3201012010880003",
        nama_lengkap: "Ahmad Hidayat",
        tempat_lahir: "Bandung",
        tanggal_lahir: "1988-10-20",
        jenis_kelamin: "L",
        no_hp: "085712345678",
        alamat: "Jl. Dago Asri No. 12, Bandung",
        pekerjaan: "Pegawai Negeri Sipil",
        status_keanggotaan: "active",
      })
      .returning();

    console.log("\n✅ Seeding selesai! Ringkasan Data Testing:\n");
    console.table([
      {
        No: 1,
        Tipe: "Super Admin",
        Username: adminUser.username,
        "Nama Lengkap": adminMember.nama_lengkap,
        Role: adminUser.role,
        "No. Anggota": adminMember.no_anggota,
        "No. HP": adminUser.phone,
        Email: adminUser.email,
        Password: "admin123",
        Status: "Aktif (Login Siap)",
      },
      {
        No: 2,
        Tipe: "Member Aktif",
        Username: memberUser.username,
        "Nama Lengkap": activeMember.nama_lengkap,
        Role: memberUser.role,
        "No. Anggota": activeMember.no_anggota,
        "No. HP": memberUser.phone,
        Email: memberUser.email,
        Password: "member123",
        Status: "Aktif (Login Siap)",
      },
      {
        No: 3,
        Tipe: "Member Lama (Unactivated)",
        Username: "-",
        "Nama Lengkap": unactivatedMember.nama_lengkap,
        Role: "-",
        "No. Anggota": unactivatedMember.no_anggota,
        "No. HP": unactivatedMember.no_hp,
        Email: "-",
        Password: "(Belum Ada Akun)",
        Status: "Siap Uji Aktivasi & OTP",
      },
    ]);

    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal melakukan seeding:", error);
    process.exit(1);
  }
}

seed();
