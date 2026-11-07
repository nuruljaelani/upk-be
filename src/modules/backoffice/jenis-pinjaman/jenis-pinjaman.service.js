import { count, eq, and, or, ilike, desc } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { jenisPinjaman, pengajuanPinjaman } from "../../../db/schema/pinjaman.js";
import { ApiError } from "../../../utils/errors.js";

export class JenisPinjamanService {
  // 1. Get All Master Jenis Pinjaman (dengan filter & search)
  static async getAll({ search, status = "all", page, limit }) {
    const conditions = [];

    if (status === "active") {
      conditions.push(eq(jenisPinjaman.is_active, true));
    } else if (status === "inactive") {
      conditions.push(eq(jenisPinjaman.is_active, false));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(jenisPinjaman.nama, term),
          ilike(jenisPinjaman.kode, term),
          ilike(jenisPinjaman.deskripsi, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Jika parameter page atau limit diberikan, aktifkan pagination
    if (page !== undefined || limit !== undefined) {
      const currentPage = Math.max(1, parseInt(page, 10) || 1);
      const perPage = Math.max(1, parseInt(limit, 10) || 10);
      const offset = (currentPage - 1) * perPage;

      const [totalRows] = await db
        .select({ count: count() })
        .from(jenisPinjaman)
        .where(whereClause);

      const total = Number(totalRows?.count || 0);
      const totalPages = Math.ceil(total / perPage);

      const items = await db
        .select()
        .from(jenisPinjaman)
        .where(whereClause)
        .orderBy(desc(jenisPinjaman.created_at))
        .limit(perPage)
        .offset(offset);

      return {
        items,
        pagination: {
          page: currentPage,
          limit: perPage,
          total,
          totalPages,
        },
      };
    }

    const items = await db
      .select()
      .from(jenisPinjaman)
      .where(whereClause)
      .orderBy(desc(jenisPinjaman.created_at));

    return { items, pagination: null };
  }

  // 2. Get Detail Jenis Pinjaman by ID
  static async getById(id) {
    const [item] = await db
      .select()
      .from(jenisPinjaman)
      .where(eq(jenisPinjaman.id, id))
      .limit(1);

    if (!item) {
      throw ApiError.notFound("Jenis pinjaman tidak ditemukan");
    }

    return item;
  }

  // 3. Tambah Jenis Pinjaman Baru (Kode otomatis digenerate jika kosong)
  static async create(input) {
    let kode = input.kode ? String(input.kode).trim().toUpperCase() : "";

    if (!kode) {
      const [total] = await db.select({ count: count() }).from(jenisPinjaman);
      let counter = Number(total?.count || 0) + 1;
      kode = `JP-${String(counter).padStart(3, "0")}`;

      let isUnique = false;
      while (!isUnique) {
        const [check] = await db
          .select({ id: jenisPinjaman.id })
          .from(jenisPinjaman)
          .where(eq(jenisPinjaman.kode, kode))
          .limit(1);

        if (!check) {
          isUnique = true;
        } else {
          counter++;
          kode = `JP-${String(counter).padStart(3, "0")}`;
        }
      }
    } else {
      const existing = await db
        .select({ id: jenisPinjaman.id })
        .from(jenisPinjaman)
        .where(eq(jenisPinjaman.kode, kode))
        .limit(1);

      if (existing.length > 0) {
        throw ApiError.conflict(`Jenis pinjaman dengan kode '${kode}' sudah ada`);
      }
    }

    const rawMetode = input.metode_bunga || input.metodeBunga || input.tipeBunga || "flat";
    const metodeBunga = String(rawMetode).toLowerCase();
    const sukuBungaTahunan = (input.suku_bunga_tahunan ?? input.sukuBungaTahunan ?? input.sukuBunga ?? 12).toString();
    const tenorMinBulan = Number(input.tenor_min_bulan ?? input.tenorMinBulan ?? 1);
    const tenorMaxBulan = Number(input.tenor_max_bulan ?? input.tenorMaxBulan ?? input.tenorMaksimal ?? 60);
    const plafonMin = (input.plafon_min ?? input.plafonMin ?? 500000).toString();
    const plafonMax = (input.plafon_max ?? input.plafonMax ?? 100000000).toString();
    const biayaAdminPersen = (input.biaya_admin_persen ?? input.biayaAdminPersen ?? input.biayaAdmin ?? 1).toString();
    
    let isActive = true;
    if (input.is_active !== undefined) {
      isActive = Boolean(input.is_active);
    } else if (input.isActive !== undefined) {
      isActive = Boolean(input.isActive);
    } else if (input.status !== undefined) {
      isActive = input.status === "Aktif" || input.status === true;
    }

    const [created] = await db
      .insert(jenisPinjaman)
      .values({
        kode: kode,
        nama: input.nama,
        metode_bunga: metodeBunga,
        suku_bunga_tahunan: sukuBungaTahunan,
        tenor_min_bulan: tenorMinBulan,
        tenor_max_bulan: tenorMaxBulan,
        plafon_min: plafonMin,
        plafon_max: plafonMax,
        biaya_admin_persen: biayaAdminPersen,
        deskripsi: input.deskripsi || null,
        is_active: isActive,
      })
      .returning();

    return created;
  }

  // 4. Update Jenis Pinjaman
  static async update(id, input) {
    const [existing] = await db
      .select()
      .from(jenisPinjaman)
      .where(eq(jenisPinjaman.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound("Jenis pinjaman tidak ditemukan");
    }

    if (input.kode && input.kode !== existing.kode) {
      const codeCheck = await db
        .select({ id: jenisPinjaman.id })
        .from(jenisPinjaman)
        .where(eq(jenisPinjaman.kode, input.kode))
        .limit(1);

      if (codeCheck.length > 0) {
        throw ApiError.conflict(`Kode '${input.kode}' sudah digunakan oleh jenis pinjaman lain`);
      }
    }

    const updateData = {};
    if (input.kode !== undefined && input.kode !== null && input.kode !== "") updateData.kode = input.kode;
    if (input.nama !== undefined) updateData.nama = input.nama;
    
    const rawMetode = input.metode_bunga || input.metodeBunga || input.tipeBunga;
    if (rawMetode !== undefined) {
      updateData.metode_bunga = String(rawMetode).toLowerCase();
    }

    const rawSuku = input.suku_bunga_tahunan ?? input.sukuBungaTahunan ?? input.sukuBunga;
    if (rawSuku !== undefined) {
      updateData.suku_bunga_tahunan = rawSuku.toString();
    }

    const rawTenorMin = input.tenor_min_bulan ?? input.tenorMinBulan;
    if (rawTenorMin !== undefined) {
      updateData.tenor_min_bulan = Number(rawTenorMin);
    }

    const rawTenorMax = input.tenor_max_bulan ?? input.tenorMaxBulan ?? input.tenorMaksimal;
    if (rawTenorMax !== undefined) {
      updateData.tenor_max_bulan = Number(rawTenorMax);
    }

    const rawPlafonMin = input.plafon_min ?? input.plafonMin;
    if (rawPlafonMin !== undefined) {
      updateData.plafon_min = rawPlafonMin.toString();
    }

    const rawPlafonMax = input.plafon_max ?? input.plafonMax;
    if (rawPlafonMax !== undefined) {
      updateData.plafon_max = rawPlafonMax.toString();
    }

    const rawBiayaAdmin = input.biaya_admin_persen ?? input.biayaAdminPersen ?? input.biayaAdmin;
    if (rawBiayaAdmin !== undefined) {
      updateData.biaya_admin_persen = rawBiayaAdmin.toString();
    }

    if (input.deskripsi !== undefined) updateData.deskripsi = input.deskripsi;

    if (input.is_active !== undefined) {
      updateData.is_active = Boolean(input.is_active);
    } else if (input.isActive !== undefined) {
      updateData.is_active = Boolean(input.isActive);
    } else if (input.status !== undefined) {
      updateData.is_active = input.status === "Aktif" || input.status === true;
    }

    const [updated] = await db
      .update(jenisPinjaman)
      .set(updateData)
      .where(eq(jenisPinjaman.id, id))
      .returning();

    return updated;
  }

  // 5. Hapus / Nonaktifkan Jenis Pinjaman
  static async delete(id) {
    const [existing] = await db
      .select()
      .from(jenisPinjaman)
      .where(eq(jenisPinjaman.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound("Jenis pinjaman tidak ditemukan");
    }

    // Cek apakah ada pengajuan pinjaman aktif yang memakai jenis pinjaman ini
    const [inUse] = await db
      .select({ id: pengajuanPinjaman.id })
      .from(pengajuanPinjaman)
      .where(eq(pengajuanPinjaman.jenis_pinjaman_id, id))
      .limit(1);

    if (inUse) {
      // Jika sudah digunakan, lakukan soft-delete (set is_active = false)
      const [deactivated] = await db
        .update(jenisPinjaman)
        .set({ is_active: false })
        .where(eq(jenisPinjaman.id, id))
        .returning();

      return {
        action: "deactivated",
        message: "Jenis pinjaman telah dinonaktifkan karena telah memiliki riwayat pinjaman",
        data: deactivated,
      };
    }

    // Jika belum pernah digunakan, aman di-hard delete
    await db.delete(jenisPinjaman).where(eq(jenisPinjaman.id, id));

    return {
      action: "deleted",
      message: "Jenis pinjaman berhasil dihapus secara permanen",
    };
  }
}
