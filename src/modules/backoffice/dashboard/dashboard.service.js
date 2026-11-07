import { count, sum, eq, desc } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { members } from "../../../db/schema/members.js";
import {
  rekeningSimpanan,
  jenisSimpanan,
  mutasiSimpanan,
} from "../../../db/schema/simpanan.js";
import {
  pengajuanPinjaman,
  pembayaranAngsuran,
} from "../../../db/schema/pinjaman.js";

export class DashboardService {
  static async getDashboardStats() {
    // 1. Anggota Statistics
    const [totalAnggota] = await db.select({ count: count() }).from(members);
    const [anggotaAktif] = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.status_keanggotaan, "active"));
    const [anggotaPending] = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.status_keanggotaan, "pending"));

    // 2. Simpanan Statistics
    const [totalSimpanan] = await db
      .select({ total: sum(rekeningSimpanan.saldo) })
      .from(rekeningSimpanan)
      .where(eq(rekeningSimpanan.status, "aktif"));

    const simpananBreakdown = await db
      .select({
        jenisId: jenisSimpanan.id,
        nama: jenisSimpanan.nama,
        tipe: jenisSimpanan.tipe,
        totalSaldo: sum(rekeningSimpanan.saldo),
      })
      .from(rekeningSimpanan)
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .where(eq(rekeningSimpanan.status, "aktif"))
      .groupBy(jenisSimpanan.id, jenisSimpanan.nama, jenisSimpanan.tipe);

    // 3. Pinjaman Statistics
    const [pinjamanAktif] = await db
      .select({
        count: count(),
        totalPlafon: sum(pengajuanPinjaman.jumlah_pinjaman),
        totalSisaPiutang: sum(pengajuanPinjaman.sisa_pokok),
      })
      .from(pengajuanPinjaman)
      .where(eq(pengajuanPinjaman.status, "dicairkan"));

    const [pinjamanDiajukan] = await db
      .select({ count: count() })
      .from(pengajuanPinjaman)
      .where(eq(pengajuanPinjaman.status, "diajukan"));

    // 4. Transaksi Terbaru (5 Setoran/Tarikan Simpanan Terakhir)
    const recentMutasiSimpanan = await db
      .select({
        id: mutasiSimpanan.id,
        kode: mutasiSimpanan.kode_transaksi,
        jenis: mutasiSimpanan.jenis_mutasi,
        nominal: mutasiSimpanan.nominal,
        tanggal: mutasiSimpanan.tanggal_transaksi,
        nomorRekening: rekeningSimpanan.nomor_rekening,
      })
      .from(mutasiSimpanan)
      .innerJoin(rekeningSimpanan, eq(mutasiSimpanan.rekening_id, rekeningSimpanan.id))
      .orderBy(desc(mutasiSimpanan.tanggal_transaksi))
      .limit(5);

    // 5. Pembayaran Angsuran Terakhir
    const recentAngsuran = await db
      .select({
        id: pembayaranAngsuran.id,
        kode: pembayaranAngsuran.kode_pembayaran,
        nominal: pembayaranAngsuran.nominal_bayar,
        tanggal: pembayaranAngsuran.tanggal_bayar,
        nomorPinjaman: pengajuanPinjaman.nomor_pinjaman,
      })
      .from(pembayaranAngsuran)
      .innerJoin(pengajuanPinjaman, eq(pembayaranAngsuran.pinjaman_id, pengajuanPinjaman.id))
      .orderBy(desc(pembayaranAngsuran.tanggal_bayar))
      .limit(5);

    return {
      anggota: {
        total: Number(totalAnggota.count),
        aktif: Number(anggotaAktif.count),
        pending: Number(anggotaPending.count),
      },
      simpanan: {
        totalSaldo: Number(totalSimpanan.total || 0),
        breakdown: simpananBreakdown.map((item) => ({
          ...item,
          totalSaldo: Number(item.totalSaldo || 0),
        })),
      },
      pinjaman: {
        totalAktif: Number(pinjamanAktif.count || 0),
        totalSisaPiutang: Number(pinjamanAktif.totalSisaPiutang || 0),
        totalPlafonDicairkan: Number(pinjamanAktif.totalPlafon || 0),
        menungguPersetujuan: Number(pinjamanDiajukan.count || 0),
      },
      transaksiTerbaru: {
        simpanan: recentMutasiSimpanan,
        angsuran: recentAngsuran,
      },
    };
  }
}
