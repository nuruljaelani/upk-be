import { eq, and, desc, count, or, ilike, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  jenisPinjaman,
  pengajuanPinjaman,
  jadwalAngsuran,
  pembayaranAngsuran,
} from "../../db/schema/pinjaman.js";
import { members } from "../../db/schema/members.js";
import { PinjamanCalculator } from "./pinjaman.calculator.js";
import { ApiError } from "../../utils/errors.js";

export class PinjamanService {
  // 1. Get Master Jenis Pinjaman
  static async getJenisPinjamanList() {
    return await db
      .select()
      .from(jenisPinjaman)
      .where(eq(jenisPinjaman.is_active, true))
      .orderBy(jenisPinjaman.created_at);
  }

  // 2. Create Jenis Pinjaman
  static async createJenisPinjaman(input) {
    const existing = await db
      .select({ id: jenisPinjaman.id })
      .from(jenisPinjaman)
      .where(eq(jenisPinjaman.kode, input.kode))
      .limit(1);

    if (existing.length > 0) {
      throw ApiError.conflict(`Jenis pinjaman dengan kode '${input.kode}' sudah ada`);
    }

    const metodeBunga = input.metode_bunga || input.metodeBunga;
    const sukuBungaTahunan = input.suku_bunga_tahunan || input.sukuBungaTahunan;
    const tenorMinBulan = input.tenor_min_bulan || input.tenorMinBulan;
    const tenorMaxBulan = input.tenor_max_bulan || input.tenorMaxBulan;
    const plafonMin = input.plafon_min || input.plafonMin;
    const plafonMax = input.plafon_max || input.plafonMax;
    const biayaAdminPersen = input.biaya_admin_persen || input.biayaAdminPersen;

    const [created] = await db
      .insert(jenisPinjaman)
      .values({
        kode: input.kode,
        nama: input.nama,
        metode_bunga: metodeBunga,
        suku_bunga_tahunan: sukuBungaTahunan.toString(),
        tenor_min_bulan: tenorMinBulan,
        tenor_max_bulan: tenorMaxBulan,
        plafon_min: plafonMin.toString(),
        plafon_max: plafonMax.toString(),
        biaya_admin_persen: biayaAdminPersen.toString(),
        deskripsi: input.deskripsi,
      })
      .returning();

    return created;
  }

  // 3. Simulasi Angsuran Pinjaman
  static simulasi(input) {
    return PinjamanCalculator.hitungJadwal({
      jumlahPinjaman: input.jumlah_pinjaman || input.jumlahPinjaman,
      tenorBulan: input.tenor_bulan || input.tenorBulan,
      sukuBungaTahunan: input.suku_bunga_tahunan || input.sukuBungaTahunan,
      metodeBunga: input.metode_bunga || input.metodeBunga,
    });
  }

  // 4. Pengajuan Pinjaman oleh Member
  static async ajukanPinjaman(input, memberId) {
    // Validasi Member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      throw ApiError.notFound("Data anggota tidak ditemukan");
    }

    if (member.status_keanggotaan !== "active") {
      throw ApiError.badRequest("Status keanggotaan belum aktif untuk mengajukan pinjaman");
    }

    const jenisPinjamanId = input.jenis_pinjaman_id || input.jenisPinjamanId;

    // Validasi Jenis Pinjaman
    const [jenis] = await db
      .select()
      .from(jenisPinjaman)
      .where(and(eq(jenisPinjaman.id, jenisPinjamanId), eq(jenisPinjaman.is_active, true)))
      .limit(1);

    if (!jenis) {
      throw ApiError.notFound("Jenis pinjaman tidak ditemukan atau sedang tidak aktif");
    }

    const jumlah = Number(input.jumlah_pinjaman || input.jumlahPinjaman);
    const tenor = Number(input.tenor_bulan || input.tenorBulan);
    const plafonMin = Number(jenis.plafon_min);
    const plafonMax = Number(jenis.plafon_max);

    if (jumlah < plafonMin || jumlah > plafonMax) {
      throw ApiError.badRequest(
        `Jumlah pinjaman harus antara Rp ${plafonMin.toLocaleString("id-ID")} s/d Rp ${plafonMax.toLocaleString("id-ID")}`
      );
    }

    if (tenor < jenis.tenor_min_bulan || tenor > jenis.tenor_max_bulan) {
      throw ApiError.badRequest(
        `Tenor pinjaman harus antara ${jenis.tenor_min_bulan} s/d ${jenis.tenor_max_bulan} bulan`
      );
    }

    // Hitung kalkulasi bunga
    const sukuBunga = Number(jenis.suku_bunga_tahunan);
    const calc = PinjamanCalculator.hitungJadwal({
      jumlahPinjaman: jumlah,
      tenorBulan: tenor,
      sukuBungaTahunan: sukuBunga,
      metodeBunga: jenis.metode_bunga,
    });

    const biayaAdmin = Math.round(((jumlah * Number(jenis.biaya_admin_persen)) / 100) * 100) / 100;

    // Generate Nomor Pinjaman
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const nomorPinjaman = `PINJ-${year}-${rand}`;

    // Simpan dokumen pendukung (KTP, KK, agunan, dsb) jika ada
    const rawDokumen =
      input.dokumen_pendukung ||
      input.dokumenPendukung ||
      input.dokumenPersyaratan ||
      null;

    let serializedDokumen = null;
    if (rawDokumen) {
      serializedDokumen =
        typeof rawDokumen === "string"
          ? rawDokumen
          : JSON.stringify(rawDokumen);
    }

    const [newPinjaman] = await db
      .insert(pengajuanPinjaman)
      .values({
        member_id: memberId,
        jenis_pinjaman_id: jenis.id,
        nomor_pinjaman: nomorPinjaman,
        jumlah_pinjaman: jumlah.toFixed(2),
        tenor_bulan: tenor,
        suku_bunga_tahunan: sukuBunga.toFixed(2),
        metode_bunga: jenis.metode_bunga,
        total_bunga: calc.totalBunga.toFixed(2),
        total_kewajiban: calc.totalKewajiban.toFixed(2),
        sisa_pokok: jumlah.toFixed(2),
        angsuran_per_bulan: calc.estimasiAngsuranBulanan.toFixed(2),
        biaya_admin: biayaAdmin.toFixed(2),
        tujuan_pinjaman: input.tujuan_pinjaman || input.tujuanPinjaman,
        dokumen_pendukung: serializedDokumen,
        status: "diajukan",
      })
      .returning();

    return {
      ...newPinjaman,
      jenisPinjaman: jenis,
      simulasi: calc,
    };
  }

  // 5. Review (Approval / Reject) oleh Staf / Operator
  static async reviewPinjaman(pinjamanId, { status, catatanReview, catatan_review }, reviewerId) {
    const finalCatatan = catatan_review || catatanReview;

    return await db.transaction(async (tx) => {
      const [pinjaman] = await tx
        .select()
        .from(pengajuanPinjaman)
        .where(eq(pengajuanPinjaman.id, pinjamanId))
        .limit(1);

      if (!pinjaman) {
        throw ApiError.notFound("Pengajuan pinjaman tidak ditemukan");
      }

      if (pinjaman.status !== "diajukan") {
        throw ApiError.badRequest(`Pinjaman sudah berada dalam status '${pinjaman.status}'`);
      }

      const tanggalReview = new Date();

      if (status === "disetujui") {
        // Hitung jadwal angsuran resmi
        const calc = PinjamanCalculator.hitungJadwal({
          jumlahPinjaman: Number(pinjaman.jumlah_pinjaman),
          tenorBulan: pinjaman.tenor_bulan,
          sukuBungaTahunan: Number(pinjaman.suku_bunga_tahunan),
          metodeBunga: pinjaman.metode_bunga,
          tanggalMulai: tanggalReview,
        });

        // Insert seluruh baris jadwal cicilan
        const jadwalValues = calc.jadwal.map((item) => ({
          pinjaman_id: pinjaman.id,
          angsuran_ke: item.angsuranKe,
          tanggal_jatuh_tempo: item.tanggalJatuhTempo,
          pokok: item.pokok.toFixed(2),
          bunga: item.bunga.toFixed(2),
          total_angsuran: item.totalAngsuran.toFixed(2),
          sisa_pokok: item.sisaPokok.toFixed(2),
          status_bayar: "belum_bayar",
        }));

        await tx.insert(jadwalAngsuran).values(jadwalValues);

        // Update status pinjaman
        const [updated] = await tx
          .update(pengajuanPinjaman)
          .set({
            status: "disetujui",
            catatan_review: finalCatatan || "Disetujui",
            reviewer_id: reviewerId,
            tanggal_review: tanggalReview,
          })
          .where(eq(pengajuanPinjaman.id, pinjaman.id))
          .returning();

        return {
          ...updated,
          totalJadwalDibuat: jadwalValues.length,
        };
      } else {
        // Ditolak
        const [updated] = await tx
          .update(pengajuanPinjaman)
          .set({
            status: "ditolak",
            catatan_review: finalCatatan || "Ditolak",
            reviewer_id: reviewerId,
            tanggal_review: tanggalReview,
          })
          .where(eq(pengajuanPinjaman.id, pinjaman.id))
          .returning();

        return updated;
      }
    });
  }

  // 6. Pencairan Pinjaman (Staf/BO)
  static async cairkanPinjaman(pinjamanId) {
    const [pinjaman] = await db
      .select()
      .from(pengajuanPinjaman)
      .where(eq(pengajuanPinjaman.id, pinjamanId))
      .limit(1);

    if (!pinjaman) {
      throw ApiError.notFound("Pinjaman tidak ditemukan");
    }

    if (pinjaman.status !== "disetujui") {
      throw ApiError.badRequest("Hanya pinjaman berstatus 'disetujui' yang dapat dicairkan");
    }

    const [updated] = await db
      .update(pengajuanPinjaman)
      .set({
        status: "dicairkan",
        tanggal_pencairan: new Date(),
      })
      .where(eq(pengajuanPinjaman.id, pinjaman.id))
      .returning();

    return updated;
  }

  // 7. Get Daftar Pinjaman Member
  static async getPinjamanByMember(memberId) {
    return await db
      .select({
        id: pengajuanPinjaman.id,
        nomor_pinjaman: pengajuanPinjaman.nomor_pinjaman,
        jumlah_pinjaman: pengajuanPinjaman.jumlah_pinjaman,
        tenor_bulan: pengajuanPinjaman.tenor_bulan,
        angsuran_per_bulan: pengajuanPinjaman.angsuran_per_bulan,
        sisa_pokok: pengajuanPinjaman.sisa_pokok,
        total_kewajiban: pengajuanPinjaman.total_kewajiban,
        tujuan_pinjaman: pengajuanPinjaman.tujuan_pinjaman,
        dokumen_pendukung: pengajuanPinjaman.dokumen_pendukung,
        status: pengajuanPinjaman.status,
        created_at: pengajuanPinjaman.created_at,
        jenis: {
          id: jenisPinjaman.id,
          kode: jenisPinjaman.kode,
          nama: jenisPinjaman.nama,
          metode_bunga: jenisPinjaman.metode_bunga,
        },
      })
      .from(pengajuanPinjaman)
      .innerJoin(jenisPinjaman, eq(pengajuanPinjaman.jenis_pinjaman_id, jenisPinjaman.id))
      .where(eq(pengajuanPinjaman.member_id, memberId))
      .orderBy(desc(pengajuanPinjaman.created_at));
  }

  // 8. Get Detail Pinjaman & Jadwal Angsuran
  static async getPinjamanDetail(pinjamanId) {
    const [loan] = await db
      .select({
        id: pengajuanPinjaman.id,
        member_id: pengajuanPinjaman.member_id,
        nomor_pinjaman: pengajuanPinjaman.nomor_pinjaman,
        jumlah_pinjaman: pengajuanPinjaman.jumlah_pinjaman,
        tenor_bulan: pengajuanPinjaman.tenor_bulan,
        suku_bunga_tahunan: pengajuanPinjaman.suku_bunga_tahunan,
        metode_bunga: pengajuanPinjaman.metode_bunga,
        total_bunga: pengajuanPinjaman.total_bunga,
        total_kewajiban: pengajuanPinjaman.total_kewajiban,
        sisa_pokok: pengajuanPinjaman.sisa_pokok,
        angsuran_per_bulan: pengajuanPinjaman.angsuran_per_bulan,
        biaya_admin: pengajuanPinjaman.biaya_admin,
        tujuan_pinjaman: pengajuanPinjaman.tujuan_pinjaman,
        dokumen_pendukung: pengajuanPinjaman.dokumen_pendukung,
        status: pengajuanPinjaman.status,
        catatan_review: pengajuanPinjaman.catatan_review,
        tanggal_review: pengajuanPinjaman.tanggal_review,
        tanggal_pencairan: pengajuanPinjaman.tanggal_pencairan,
        created_at: pengajuanPinjaman.created_at,
        jenis: {
          id: jenisPinjaman.id,
          kode: jenisPinjaman.kode,
          nama: jenisPinjaman.nama,
        },
        member: {
          id: members.id,
          no_anggota: members.no_anggota,
          nama_lengkap: members.nama_lengkap,
        },
      })
      .from(pengajuanPinjaman)
      .innerJoin(jenisPinjaman, eq(pengajuanPinjaman.jenis_pinjaman_id, jenisPinjaman.id))
      .innerJoin(members, eq(pengajuanPinjaman.member_id, members.id))
      .where(eq(pengajuanPinjaman.id, pinjamanId))
      .limit(1);

    if (!loan) {
      throw ApiError.notFound("Data pinjaman tidak ditemukan");
    }

    // Ambil jadwal cicilan
    const jadwal = await db
      .select()
      .from(jadwalAngsuran)
      .where(eq(jadwalAngsuran.pinjaman_id, pinjamanId))
      .orderBy(jadwalAngsuran.angsuran_ke);

    return {
      ...loan,
      jadwal,
    };
  }

  // 9. Bayar Angsuran (Staf/BO)
  static async bayarAngsuran(input, operatorId) {
    const nominal = Number(input.nominal_bayar || input.nominalBayar);
    const jadwalAngsuranId = input.jadwal_angsuran_id || input.jadwalAngsuranId;
    const metodePembayaran = input.metode_pembayaran || input.metodePembayaran || "tunai";
    const buktiPembayaran = input.bukti_pembayaran || input.buktiPembayaran || null;
    const catatan = input.catatan || null;

    return await db.transaction(async (tx) => {
      // 1. Ambil jadwal angsuran
      const [jadwal] = await tx
        .select()
        .from(jadwalAngsuran)
        .where(eq(jadwalAngsuran.id, jadwalAngsuranId))
        .limit(1);

      if (!jadwal) {
        throw ApiError.notFound("Jadwal angsuran tidak ditemukan");
      }

      if (jadwal.status_bayar === "lunas") {
        throw ApiError.badRequest("Angsuran bulan ini sudah lunas");
      }

      // 2. Ambil pinjaman
      const [loan] = await tx
        .select()
        .from(pengajuanPinjaman)
        .where(eq(pengajuanPinjaman.id, jadwal.pinjaman_id))
        .limit(1);

      if (loan.status !== "dicairkan") {
        throw ApiError.badRequest("Pembayaran angsuran hanya dapat diproses untuk pinjaman yang telah dicairkan");
      }

      const totalTagihan = Number(jadwal.total_angsuran);
      const isLunas = nominal >= totalTagihan;

      // 3. Generate Kode Pembayaran
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Math.floor(1000 + Math.random() * 9000);
      const kodePembayaran = `BYR-ANG-${dateStr}-${rand}`;

      // 4. Catat riwayat pembayaran
      const [pembayaran] = await tx
        .insert(pembayaranAngsuran)
        .values({
          jadwal_angsuran_id: jadwal.id,
          pinjaman_id: loan.id,
          operator_id: operatorId || null,
          kode_pembayaran: kodePembayaran,
          nominal_bayar: nominal.toFixed(2),
          denda: "0.00",
          metode_pembayaran: metodePembayaran,
          bukti_pembayaran: buktiPembayaran,
          catatan: catatan,
        })
        .returning();

      // 5. Update status jadwal angsuran
      await tx
        .update(jadwalAngsuran)
        .set({
          status_bayar: isLunas ? "lunas" : "sebagian",
        })
        .where(eq(jadwalAngsuran.id, jadwal.id));

      // 6. Update sisa pokok pada pinjaman
      const sisaPokokSebelumnya = Number(loan.sisa_pokok);
      const sisaPokokBaru = Math.max(0, sisaPokokSebelumnya - Number(jadwal.pokok));

      // Cek apakah seluruh angsuran sudah lunas
      const sisaBelumLunas = await tx
        .select()
        .from(jadwalAngsuran)
        .where(
          and(
            eq(jadwalAngsuran.pinjaman_id, loan.id),
            eq(jadwalAngsuran.status_bayar, "belum_bayar")
          )
        );

      const statusPinjamanBaru = sisaBelumLunas.length === 0 && isLunas ? "lunas" : loan.status;

      await tx
        .update(pengajuanPinjaman)
        .set({
          sisa_pokok: sisaPokokBaru.toFixed(2),
          status: statusPinjamanBaru,
        })
        .where(eq(pengajuanPinjaman.id, loan.id));

      return {
        pembayaran,
        angsuranKe: jadwal.angsuran_ke,
        statusAngsuran: isLunas ? "lunas" : "sebagian",
        sisaPokokPinjaman: sisaPokokBaru,
        statusPinjaman: statusPinjamanBaru,
      };
    });
  }

  // 10. Get All Pengajuan Pinjaman untuk Back Office dengan Serverside Pagination & Filter
  static async getAllPengajuan({
    search,
    status,
    jenisPinjamanId,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;
    const conditions = [];

    if (status && status !== "Semua") {
      conditions.push(eq(pengajuanPinjaman.status, status.toLowerCase()));
    }

    if (jenisPinjamanId && jenisPinjamanId !== "Semua") {
      conditions.push(eq(pengajuanPinjaman.jenis_pinjaman_id, jenisPinjamanId));
    }

    if (startDate) {
      conditions.push(gte(pengajuanPinjaman.created_at, new Date(`${startDate}T00:00:00Z`)));
    }

    if (endDate) {
      conditions.push(lte(pengajuanPinjaman.created_at, new Date(`${endDate}T23:59:59Z`)));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(pengajuanPinjaman.nomor_pinjaman, term),
          ilike(members.nama_lengkap, term),
          ilike(members.no_anggota, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total rows
    const [totalRow] = await db
      .select({ count: count() })
      .from(pengajuanPinjaman)
      .innerJoin(jenisPinjaman, eq(pengajuanPinjaman.jenis_pinjaman_id, jenisPinjaman.id))
      .innerJoin(members, eq(pengajuanPinjaman.member_id, members.id))
      .where(whereClause);

    const total = Number(totalRow?.count || 0);
    const totalPages = Math.ceil(total / limitNum);

    // Items
    const items = await db
      .select({
        id: pengajuanPinjaman.id,
        nomor_pinjaman: pengajuanPinjaman.nomor_pinjaman,
        member_id: pengajuanPinjaman.member_id,
        jenis_pinjaman_id: pengajuanPinjaman.jenis_pinjaman_id,
        jumlah_pinjaman: pengajuanPinjaman.jumlah_pinjaman,
        tenor_bulan: pengajuanPinjaman.tenor_bulan,
        suku_bunga_tahunan: pengajuanPinjaman.suku_bunga_tahunan,
        metode_bunga: pengajuanPinjaman.metode_bunga,
        total_bunga: pengajuanPinjaman.total_bunga,
        total_kewajiban: pengajuanPinjaman.total_kewajiban,
        sisa_pokok: pengajuanPinjaman.sisa_pokok,
        angsuran_per_bulan: pengajuanPinjaman.angsuran_per_bulan,
        biaya_admin: pengajuanPinjaman.biaya_admin,
        tujuan_pinjaman: pengajuanPinjaman.tujuan_pinjaman,
        dokumen_pendukung: pengajuanPinjaman.dokumen_pendukung,
        status: pengajuanPinjaman.status,
        catatan_review: pengajuanPinjaman.catatan_review,
        tanggal_review: pengajuanPinjaman.tanggal_review,
        tanggal_pencairan: pengajuanPinjaman.tanggal_pencairan,
        created_at: pengajuanPinjaman.created_at,
        jenis: {
          id: jenisPinjaman.id,
          kode: jenisPinjaman.kode,
          nama: jenisPinjaman.nama,
          metode_bunga: jenisPinjaman.metode_bunga,
        },
        member: {
          id: members.id,
          no_anggota: members.no_anggota,
          nama_lengkap: members.nama_lengkap,
          nik: members.nik,
          no_hp: members.no_hp,
          alamat: members.alamat,
        },
      })
      .from(pengajuanPinjaman)
      .innerJoin(jenisPinjaman, eq(pengajuanPinjaman.jenis_pinjaman_id, jenisPinjaman.id))
      .innerJoin(members, eq(pengajuanPinjaman.member_id, members.id))
      .where(whereClause)
      .orderBy(desc(pengajuanPinjaman.created_at))
      .limit(limitNum)
      .offset(offset);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  }
}
