import { count, eq, and, or, ilike, desc } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { members } from "../../../db/schema/members.js";
import { users } from "../../../db/schema/users.js";
import { rekeningSimpanan, jenisSimpanan } from "../../../db/schema/simpanan.js";
import { pengajuanPinjaman, jenisPinjaman } from "../../../db/schema/pinjaman.js";
import { ApiError } from "../../../utils/errors.js";

export class AnggotaService {
  // 1. Get List Anggota dengan Search & Filter Pagination
  static async getAnggotaList({ search, status, page = 1, limit = 10 }) {
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (currentPage - 1) * perPage;
    const conditions = [];

    if (status) {
      conditions.push(eq(members.status_keanggotaan, status));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(members.nama_lengkap, term),
          ilike(members.nik, term),
          ilike(members.no_anggota, term),
          ilike(members.no_hp, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRows] = await db
      .select({ count: count() })
      .from(members)
      .where(whereClause);

    const total = Number(totalRows?.count || 0);
    const totalPages = Math.ceil(total / perPage);

    const list = await db
      .select({
        id: members.id,
        userId: members.user_id,
        noAnggota: members.no_anggota,
        nik: members.nik,
        namaLengkap: members.nama_lengkap,
        tempatLahir: members.tempat_lahir,
        tanggalLahir: members.tanggal_lahir,
        jenisKelamin: members.jenis_kelamin,
        noHp: members.no_hp,
        alamat: members.alamat,
        pekerjaan: members.pekerjaan,
        statusKeanggotaan: members.status_keanggotaan,
        isVerified: members.is_verified,
        fotoProfil: members.foto_profil,
        fotoKtp: members.foto_ktp,
        tanggalBergabung: members.tanggal_bergabung,
        createdAt: members.created_at,
        email: users.email,
        username: users.username,
      })
      .from(members)
      .leftJoin(users, eq(members.user_id, users.id))
      .where(whereClause)
      .orderBy(desc(members.created_at))
      .limit(perPage)
      .offset(offset);

    return {
      items: list,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages,
      },
    };
  }

  // 2. Get Detail Anggota beserta Rekening Simpanan & Pinjaman
  static async getAnggotaById(memberId) {
    const [member] = await db
      .select({
        id: members.id,
        userId: members.user_id,
        noAnggota: members.no_anggota,
        nik: members.nik,
        namaLengkap: members.nama_lengkap,
        tempatLahir: members.tempat_lahir,
        tanggalLahir: members.tanggal_lahir,
        jenisKelamin: members.jenis_kelamin,
        noHp: members.no_hp,
        alamat: members.alamat,
        pekerjaan: members.pekerjaan,
        statusKeanggotaan: members.status_keanggotaan,
        isVerified: members.is_verified,
        fotoProfil: members.foto_profil,
        fotoKtp: members.foto_ktp,
        tanggalBergabung: members.tanggal_bergabung,
        createdAt: members.created_at,
        email: users.email,
        username: users.username,
      })
      .from(members)
      .leftJoin(users, eq(members.user_id, users.id))
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      throw ApiError.notFound("Data anggota tidak ditemukan");
    }

    // Ambil rekening simpanan anggota
    const rekeningList = await db
      .select({
        id: rekeningSimpanan.id,
        nomorRekening: rekeningSimpanan.nomor_rekening,
        jenisSimpanan: jenisSimpanan.nama,
        tipe: jenisSimpanan.tipe,
        saldo: rekeningSimpanan.saldo,
        status: rekeningSimpanan.status,
      })
      .from(rekeningSimpanan)
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .where(eq(rekeningSimpanan.member_id, memberId));

    // Ambil histori pinjaman anggota
    const pinjamanList = await db
      .select({
        id: pengajuanPinjaman.id,
        nomorPinjaman: pengajuanPinjaman.nomor_pinjaman,
        jenisPinjaman: jenisPinjaman.nama,
        jumlahPinjaman: pengajuanPinjaman.jumlah_pinjaman,
        sisaPokok: pengajuanPinjaman.sisa_pokok,
        status: pengajuanPinjaman.status,
        createdAt: pengajuanPinjaman.created_at,
      })
      .from(pengajuanPinjaman)
      .innerJoin(jenisPinjaman, eq(pengajuanPinjaman.jenis_pinjaman_id, jenisPinjaman.id))
      .where(eq(pengajuanPinjaman.member_id, memberId))
      .orderBy(desc(pengajuanPinjaman.created_at));

    return {
      ...member,
      rekeningSimpanan: rekeningList,
      pinjaman: pinjamanList,
    };
  }

  // 3. Tambah Anggota Baru (Master Data)
  static async createAnggota(data) {
    // Validasi NIK unik
    const existingNik = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.nik, data.nik))
      .limit(1);

    if (existingNik.length > 0) {
      throw ApiError.conflict("NIK sudah terdaftar dalam sistem");
    }

    // Generate No Anggota jika belum diisi (format: ANG-YYYYMM-XXXX)
    let rawNo = data.no_anggota || data.noAnggota || data.nomorAnggota;
    let noAnggota = rawNo ? String(rawNo).trim().toUpperCase() : "";
    if (!noAnggota) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `ANG-${year}${month}`;

      const [total] = await db.select({ count: count() }).from(members);
      let counter = Number(total?.count || 0) + 1;
      noAnggota = `${prefix}-${String(counter).padStart(4, "0")}`;

      let isUnique = false;
      while (!isUnique) {
        const [check] = await db
          .select({ id: members.id })
          .from(members)
          .where(eq(members.no_anggota, noAnggota))
          .limit(1);

        if (!check) {
          isUnique = true;
        } else {
          counter++;
          noAnggota = `${prefix}-${String(counter).padStart(4, "0")}`;
        }
      }
    }

    const namaLengkap = data.nama_lengkap || data.namaLengkap || data.nama || "";
    const noHp = data.no_hp || data.noHp || data.nomorHp || "";
    const rawJk = data.jenis_kelamin || data.jenisKelamin || "L";
    const jenisKelamin = rawJk === "Perempuan" || rawJk === "P" ? "P" : "L";
    const tempatLahir = data.tempat_lahir || data.tempatLahir || null;
    const tanggalLahir = data.tanggal_lahir || data.tanggalLahir || null;
    const pekerjaan = data.pekerjaan || null;
    
    const rawStatus = data.status_keanggotaan || data.statusKeanggotaan || data.status || "active";
    const statusKeanggotaan = rawStatus === "Aktif" || rawStatus === "active" ? "active" : rawStatus === "Tidak Aktif" || rawStatus === "inactive" ? "inactive" : rawStatus;

    const [created] = await db
      .insert(members)
      .values({
        no_anggota: noAnggota,
        nik: data.nik,
        nama_lengkap: namaLengkap,
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir,
        jenis_kelamin: jenisKelamin,
        no_hp: noHp,
        alamat: data.alamat,
        pekerjaan: pekerjaan,
        status_keanggotaan: statusKeanggotaan,
        is_verified: true,
      })
      .returning();

    return created;
  }

  // 4. Update Profil Anggota
  static async updateAnggota(memberId, data) {
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      throw ApiError.notFound("Anggota tidak ditemukan");
    }

    if (data.nik) {
      const existingNik = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.nik, data.nik))
        .limit(1);

      if (existingNik.length > 0 && existingNik[0].id !== memberId) {
        throw ApiError.conflict("NIK sudah digunakan oleh anggota lain");
      }
    }

    const updateData = {};
    if (data.nama_lengkap || data.namaLengkap || data.nama) {
      updateData.nama_lengkap = data.nama_lengkap || data.namaLengkap || data.nama;
    }
    if (data.nik) updateData.nik = data.nik;
    if (data.no_hp || data.noHp || data.nomorHp) {
      updateData.no_hp = data.no_hp || data.noHp || data.nomorHp;
    }
    if (data.jenis_kelamin || data.jenisKelamin) {
      const rawJk = data.jenis_kelamin || data.jenisKelamin;
      updateData.jenis_kelamin = rawJk === "Perempuan" || rawJk === "P" ? "P" : "L";
    }
    if (data.alamat !== undefined) updateData.alamat = data.alamat;
    if (data.tempat_lahir !== undefined || data.tempatLahir !== undefined) {
      updateData.tempat_lahir = data.tempat_lahir || data.tempatLahir || null;
    }
    if (data.tanggal_lahir !== undefined || data.tanggalLahir !== undefined) {
      updateData.tanggal_lahir = data.tanggal_lahir || data.tanggalLahir || null;
    }
    if (data.pekerjaan !== undefined) updateData.pekerjaan = data.pekerjaan;
    if (data.status_keanggotaan || data.statusKeanggotaan || data.status) {
      const rawStatus = data.status_keanggotaan || data.statusKeanggotaan || data.status;
      updateData.status_keanggotaan = rawStatus === "Aktif" || rawStatus === "active" ? "active" : "inactive";
    }
    if (data.foto_profil !== undefined || data.fotoProfil !== undefined) {
      updateData.foto_profil = data.foto_profil || data.fotoProfil || null;
    }
    if (data.foto_ktp !== undefined || data.fotoKtp !== undefined) {
      updateData.foto_ktp = data.foto_ktp || data.fotoKtp || null;
    }

    const [updated] = await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, memberId))
      .returning();

    return updated;
  }

  // 5. Update Status Keanggotaan Anggota
  static async updateAnggotaStatus(memberId, status) {
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      throw ApiError.notFound("Anggota tidak ditemukan");
    }

    const normalizedStatus = status === "Aktif" || status === "active" ? "active" : status === "Tidak Aktif" || status === "inactive" ? "inactive" : status;

    const [updated] = await db
      .update(members)
      .set({ status_keanggotaan: normalizedStatus })
      .where(eq(members.id, memberId))
      .returning();

    return updated;
  }

  // 6. Hapus / Nonaktifkan Anggota
  static async deleteAnggota(memberId) {
    const [member] = await db
      .select({ id: members.id, nama_lengkap: members.nama_lengkap })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      throw ApiError.notFound("Anggota tidak ditemukan");
    }

    // Cek apakah ada rekening simpanan aktif atau pengajuan pinjaman
    const [hasSimpanan] = await db
      .select({ id: rekeningSimpanan.id })
      .from(rekeningSimpanan)
      .where(eq(rekeningSimpanan.member_id, memberId))
      .limit(1);

    const [hasPinjaman] = await db
      .select({ id: pengajuanPinjaman.id })
      .from(pengajuanPinjaman)
      .where(eq(pengajuanPinjaman.member_id, memberId))
      .limit(1);

    if (hasSimpanan || hasPinjaman) {
      const [deactivated] = await db
        .update(members)
        .set({ status_keanggotaan: "inactive" })
        .where(eq(members.id, memberId))
        .returning();

      return {
        action: "deactivated",
        message: "Status anggota telah dinonaktifkan karena telah memiliki riwayat simpanan atau pinjaman",
        data: deactivated,
      };
    }

    // Jika belum pernah bertransaksi, aman dihapus permanen
    await db.delete(members).where(eq(members.id, memberId));

    return {
      action: "deleted",
      message: "Data anggota berhasil dihapus secara permanen",
    };
  }
}
