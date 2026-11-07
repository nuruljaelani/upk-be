import { count, eq, and, desc, gte, lte, sql } from "drizzle-orm";
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
  jadwalAngsuran,
} from "../../../db/schema/pinjaman.js";

export class LaporanService {
  // 1. Laporan Simpanan
  static async getLaporanSimpanan({ startDate, endDate }) {
    const conditions = [];

    if (startDate) {
      conditions.push(gte(mutasiSimpanan.tanggal_transaksi, new Date(`${startDate}T00:00:00Z`)));
    }
    if (endDate) {
      conditions.push(lte(mutasiSimpanan.tanggal_transaksi, new Date(`${endDate}T23:59:59Z`)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total setor dan tarik dalam periode
    const [rekap] = await db
      .select({
        totalSetor: sql`COALESCE(SUM(CASE WHEN ${mutasiSimpanan.jenis_mutasi} = 'setor' THEN ${mutasiSimpanan.nominal} ELSE 0 END), 0)`,
        totalTarik: sql`COALESCE(SUM(CASE WHEN ${mutasiSimpanan.jenis_mutasi} = 'tarik' THEN ${mutasiSimpanan.nominal} ELSE 0 END), 0)`,
        jumlahTransaksi: count(),
      })
      .from(mutasiSimpanan)
      .where(whereClause);

    // Mutasi detail
    const list = await db
      .select({
        id: mutasiSimpanan.id,
        kodeTransaksi: mutasiSimpanan.kode_transaksi,
        jenisMutasi: mutasiSimpanan.jenis_mutasi,
        nominal: mutasiSimpanan.nominal,
        saldoAwal: mutasiSimpanan.saldo_awal,
        saldoAkhir: mutasiSimpanan.saldo_akhir,
        tanggalTransaksi: mutasiSimpanan.tanggal_transaksi,
        keterangan: mutasiSimpanan.keterangan,
        rekening: {
          nomorRekening: rekeningSimpanan.nomor_rekening,
          jenis: jenisSimpanan.nama,
        },
        anggota: {
          noAnggota: members.no_anggota,
          namaLengkap: members.nama_lengkap,
        },
      })
      .from(mutasiSimpanan)
      .innerJoin(rekeningSimpanan, eq(mutasiSimpanan.rekening_id, rekeningSimpanan.id))
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .innerJoin(members, eq(rekeningSimpanan.member_id, members.id))
      .where(whereClause)
      .orderBy(desc(mutasiSimpanan.tanggal_transaksi))
      .limit(100);

    return {
      ringkasan: {
        totalSetor: Number(rekap.totalSetor),
        totalTarik: Number(rekap.totalTarik),
        arusKasBersih: Number(rekap.totalSetor) - Number(rekap.totalTarik),
        jumlahTransaksi: Number(rekap.jumlahTransaksi),
      },
      detail: list,
    };
  }

  // 2. Laporan Pinjaman
  static async getLaporanPinjaman({ startDate, endDate, status }) {
    const conditions = [];

    if (startDate) {
      conditions.push(gte(pengajuanPinjaman.created_at, new Date(`${startDate}T00:00:00Z`)));
    }
    if (endDate) {
      conditions.push(lte(pengajuanPinjaman.created_at, new Date(`${endDate}T23:59:59Z`)));
    }
    if (status && status !== "semua") {
      conditions.push(eq(pengajuanPinjaman.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: pengajuanPinjaman.id,
        nomorPinjaman: pengajuanPinjaman.nomor_pinjaman,
        jumlahPinjaman: pengajuanPinjaman.jumlah_pinjaman,
        tenorBulan: pengajuanPinjaman.tenor_bulan,
        sisaPokok: pengajuanPinjaman.sisa_pokok,
        totalKewajiban: pengajuanPinjaman.total_kewajiban,
        status: pengajuanPinjaman.status,
        tanggalReview: pengajuanPinjaman.tanggal_review,
        createdAt: pengajuanPinjaman.created_at,
        anggota: {
          noAnggota: members.no_anggota,
          namaLengkap: members.nama_lengkap,
        },
      })
      .from(pengajuanPinjaman)
      .innerJoin(members, eq(pengajuanPinjaman.member_id, members.id))
      .where(whereClause)
      .orderBy(desc(pengajuanPinjaman.created_at));

    const totalPenyaluran = list.reduce((acc, curr) => acc + Number(curr.jumlahPinjaman), 0);
    const totalSisaPiutang = list.reduce((acc, curr) => acc + Number(curr.sisaPokok), 0);

    return {
      ringkasan: {
        totalPinjaman: list.length,
        totalPenyaluran,
        totalSisaPiutang,
      },
      detail: list,
    };
  }

  // 3. Laporan Arus Kas (Cash Flow)
  static async getLaporanArusKas({ startDate, endDate }) {
    const dateFilterSimpanan = [];
    const dateFilterAngsuran = [];
    const dateFilterPinjaman = [];

    if (startDate) {
      dateFilterSimpanan.push(gte(mutasiSimpanan.tanggal_transaksi, new Date(`${startDate}T00:00:00Z`)));
      dateFilterAngsuran.push(gte(pembayaranAngsuran.tanggal_bayar, new Date(`${startDate}T00:00:00Z`)));
      dateFilterPinjaman.push(gte(pengajuanPinjaman.tanggal_pencairan, new Date(`${startDate}T00:00:00Z`)));
    }
    if (endDate) {
      dateFilterSimpanan.push(lte(mutasiSimpanan.tanggal_transaksi, new Date(`${endDate}T23:59:59Z`)));
      dateFilterAngsuran.push(lte(pembayaranAngsuran.tanggal_bayar, new Date(`${endDate}T23:59:59Z`)));
      dateFilterPinjaman.push(lte(pengajuanPinjaman.tanggal_pencairan, new Date(`${endDate}T23:59:59Z`)));
    }

    const [simpananFlow] = await db
      .select({
        setor: sql`COALESCE(SUM(CASE WHEN ${mutasiSimpanan.jenis_mutasi} = 'setor' THEN ${mutasiSimpanan.nominal} ELSE 0 END), 0)`,
        tarik: sql`COALESCE(SUM(CASE WHEN ${mutasiSimpanan.jenis_mutasi} = 'tarik' THEN ${mutasiSimpanan.nominal} ELSE 0 END), 0)`,
      })
      .from(mutasiSimpanan)
      .where(dateFilterSimpanan.length > 0 ? and(...dateFilterSimpanan) : undefined);

    const [angsuranFlow] = await db
      .select({
        totalAngsuran: sql`COALESCE(SUM(${pembayaranAngsuran.nominal_bayar}), 0)`,
      })
      .from(pembayaranAngsuran)
      .where(dateFilterAngsuran.length > 0 ? and(...dateFilterAngsuran) : undefined);

    const [pencairanFlow] = await db
      .select({
        totalCair: sql`COALESCE(SUM(${pengajuanPinjaman.jumlah_pinjaman}), 0)`,
      })
      .from(pengajuanPinjaman)
      .where(
        dateFilterPinjaman.length > 0
          ? and(eq(pengajuanPinjaman.status, "dicairkan"), ...dateFilterPinjaman)
          : eq(pengajuanPinjaman.status, "dicairkan")
      );

    const totalMasuk = Number(simpananFlow.setor) + Number(angsuranFlow.totalAngsuran);
    const totalKeluar = Number(simpananFlow.tarik) + Number(pencairanFlow.totalCair);
    const saldoKasBersih = totalMasuk - totalKeluar;

    return {
      pemasukan: {
        setoranSimpanan: Number(simpananFlow.setor),
        angsuranPinjaman: Number(angsuranFlow.totalAngsuran),
        total: totalMasuk,
      },
      pengeluaran: {
        penarikanSimpanan: Number(simpananFlow.tarik),
        pencairanPinjaman: Number(pencairanFlow.totalCair),
        total: totalKeluar,
      },
      saldoKasBersih,
    };
  }

  // 4. Laporan Kolektibilitas & NPL Pinjaman (Aging Analysis)
  static async getLaporanKolektibilitas() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ambil semua pinjaman berstatus aktif ('dicairkan' atau 'macet')
    const activeLoans = await db
      .select({
        id: pengajuanPinjaman.id,
        nomorPinjaman: pengajuanPinjaman.nomor_pinjaman,
        jumlahPinjaman: pengajuanPinjaman.jumlah_pinjaman,
        sisaPokok: pengajuanPinjaman.sisa_pokok,
        angsuranPerBulan: pengajuanPinjaman.angsuran_per_bulan,
        status: pengajuanPinjaman.status,
        tanggalPencairan: pengajuanPinjaman.tanggal_pencairan,
        anggota: {
          id: members.id,
          noAnggota: members.no_anggota,
          namaLengkap: members.nama_lengkap,
          noHp: members.no_hp,
          alamat: members.alamat,
        },
      })
      .from(pengajuanPinjaman)
      .innerJoin(members, eq(pengajuanPinjaman.member_id, members.id))
      .where(sql`${pengajuanPinjaman.status} IN ('dicairkan', 'macet')`);

    // Ambil semua jadwal angsuran yang belum bayar/sebagian
    const unpaidSchedules = await db
      .select({
        pinjamanId: jadwalAngsuran.pinjaman_id,
        angsuranKe: jadwalAngsuran.angsuran_ke,
        tanggalJatuhTempo: jadwalAngsuran.tanggal_jatuh_tempo,
        totalAngsuran: jadwalAngsuran.total_angsuran,
        statusBayar: jadwalAngsuran.status_bayar,
      })
      .from(jadwalAngsuran)
      .where(sql`${jadwalAngsuran.status_bayar} != 'lunas'`)
      .orderBy(jadwalAngsuran.tanggal_jatuh_tempo);

    // Kelompokkan jadwal belum bayar berdasarkan pinjamanId
    const schedulesByLoan = new Map();
    for (const sch of unpaidSchedules) {
      if (!schedulesByLoan.has(sch.pinjamanId)) {
        schedulesByLoan.set(sch.pinjamanId, []);
      }
      schedulesByLoan.get(sch.pinjamanId).push(sch);
    }

    const detailedList = [];
    const stats = {
      kol1: { kode: 1, label: "Lancar", deskripsi: "Tepat Waktu (0 hari)", debitur: 0, bakiDebet: 0 },
      kol2: { kode: 2, label: "Dalam Perhatian Khusus (DPK)", deskripsi: "Menunggak 1-90 hari", debitur: 0, bakiDebet: 0 },
      kol3: { kode: 3, label: "Kurang Lancar", deskripsi: "Menunggak 91-120 hari", debitur: 0, bakiDebet: 0 },
      kol4: { kode: 4, label: "Diragukan", deskripsi: "Menunggak 121-180 hari", debitur: 0, bakiDebet: 0 },
      kol5: { kode: 5, label: "Macet", deskripsi: "Menunggak >180 hari / Macet", debitur: 0, bakiDebet: 0 },
    };

    let totalBakiDebet = 0;

    for (const loan of activeLoans) {
      const loanSchedules = schedulesByLoan.get(loan.id) || [];
      const sisaPokok = Number(loan.sisaPokok || 0);
      totalBakiDebet += sisaPokok;

      // Cari jadwal tertua yang sudah lewat jatuh tempo
      let maxOverdueDays = 0;
      let overdueAmount = 0;
      let overdueCount = 0;

      for (const sch of loanSchedules) {
        const dueDate = new Date(sch.tanggalJatuhTempo);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > maxOverdueDays) {
            maxOverdueDays = diffDays;
          }
          overdueAmount += Number(sch.totalAngsuran || 0);
          overdueCount++;
        }
      }

      // Tentukan Klasifikasi Kolektibilitas
      let kol = 1;
      let kolKey = "kol1";
      if (loan.status === "macet" || maxOverdueDays > 180) {
        kol = 5;
        kolKey = "kol5";
      } else if (maxOverdueDays > 120) {
        kol = 4;
        kolKey = "kol4";
      } else if (maxOverdueDays > 90) {
        kol = 3;
        kolKey = "kol3";
      } else if (maxOverdueDays > 0) {
        kol = 2;
        kolKey = "kol2";
      }

      stats[kolKey].debitur++;
      stats[kolKey].bakiDebet += sisaPokok;

      detailedList.push({
        id: loan.id,
        nomorPinjaman: loan.nomorPinjaman,
        anggota: loan.anggota,
        jumlahPinjaman: Number(loan.jumlahPinjaman),
        sisaPokok,
        kolektibilitas: kol,
        kolektibilitasLabel: stats[kolKey].label,
        hariKeterlambatan: maxOverdueDays,
        jumlahBulanTunggakan: overdueCount,
        nominalTunggakan: overdueAmount,
      });
    }

    // Urutkan detail dari keterlambatan terbesar (Kol 5 ke Kol 1)
    detailedList.sort((a, b) => b.kolektibilitas - a.kolektibilitas || b.hariKeterlambatan - a.hariKeterlambatan);

    const nplNominal = stats.kol3.bakiDebet + stats.kol4.bakiDebet + stats.kol5.bakiDebet;
    const nplRatio = totalBakiDebet > 0 ? (nplNominal / totalBakiDebet) * 100 : 0;
    const parNominal = stats.kol2.bakiDebet + nplNominal;
    const parRatio = totalBakiDebet > 0 ? (parNominal / totalBakiDebet) * 100 : 0;

    return {
      ringkasan: {
        totalDebitur: activeLoans.length,
        totalBakiDebet,
        nplNominal,
        nplRatio: Number(nplRatio.toFixed(2)),
        parNominal,
        parRatio: Number(parRatio.toFixed(2)),
        kolektibilitas: [
          { ...stats.kol1, porsi: totalBakiDebet > 0 ? Number(((stats.kol1.bakiDebet / totalBakiDebet) * 100).toFixed(1)) : 0 },
          { ...stats.kol2, porsi: totalBakiDebet > 0 ? Number(((stats.kol2.bakiDebet / totalBakiDebet) * 100).toFixed(1)) : 0 },
          { ...stats.kol3, porsi: totalBakiDebet > 0 ? Number(((stats.kol3.bakiDebet / totalBakiDebet) * 100).toFixed(1)) : 0 },
          { ...stats.kol4, porsi: totalBakiDebet > 0 ? Number(((stats.kol4.bakiDebet / totalBakiDebet) * 100).toFixed(1)) : 0 },
          { ...stats.kol5, porsi: totalBakiDebet > 0 ? Number(((stats.kol5.bakiDebet / totalBakiDebet) * 100).toFixed(1)) : 0 },
        ],
      },
      detail: detailedList,
    };
  }

  // 5. Laporan Rekapitulasi Per Sentra / Kelompok Wilayah
  static async getLaporanRekapSentra() {
    // Ambil seluruh anggota dan hitung saldo simpanan serta pinjaman mereka
    const memberRows = await db
      .select({
        id: members.id,
        noAnggota: members.no_anggota,
        nama: members.nama_lengkap,
        alamat: members.alamat,
      })
      .from(members);

    const savingRows = await db
      .select({
        memberId: rekeningSimpanan.member_id,
        saldo: rekeningSimpanan.saldo,
      })
      .from(rekeningSimpanan);

    const loanRows = await db
      .select({
        memberId: pengajuanPinjaman.member_id,
        sisaPokok: pengajuanPinjaman.sisa_pokok,
        jumlahPinjaman: pengajuanPinjaman.jumlah_pinjaman,
        status: pengajuanPinjaman.status,
      })
      .from(pengajuanPinjaman)
      .where(sql`${pengajuanPinjaman.status} IN ('dicairkan', 'macet')`);

    // Map savings by member
    const savingsByMember = new Map();
    for (const s of savingRows) {
      const cur = savingsByMember.get(s.memberId) || 0;
      savingsByMember.set(s.memberId, cur + Number(s.saldo || 0));
    }

    // Map loans by member
    const loansByMember = new Map();
    for (const l of loanRows) {
      const cur = loansByMember.get(l.memberId) || { sisaPokok: 0, jumlahPinjaman: 0, count: 0 };
      cur.sisaPokok += Number(l.sisaPokok || 0);
      cur.jumlahPinjaman += Number(l.jumlahPinjaman || 0);
      cur.count += 1;
      loansByMember.set(l.memberId, cur);
    }

    // Kelompokkan per sentra (ekstraksi kata pertama/nama sentra dari alamat atau default)
    const sentraMap = new Map();

    for (const m of memberRows) {
      // Normalisasi nama sentra/wilayah dari alamat
      const rawAlamat = m.alamat || "Sentra Umum";
      let sentraName = "Sentra Umum";
      const match = rawAlamat.match(/(?:sentra|kelompok|dusun|desa|kp\.|kampung)\s+([a-zA-Z0-9\s]+?)(?:,|$|\.|\r|\n)/i);
      if (match && match[0]) {
        sentraName = match[0].trim().replace(/,$/, "");
      } else if (rawAlamat.length > 0) {
        sentraName = rawAlamat.split(",")[0].trim();
      }

      if (!sentraMap.has(sentraName)) {
        sentraMap.set(sentraName, {
          namaSentra: sentraName,
          totalAnggota: 0,
          totalSimpanan: 0,
          totalPinjaman: 0,
          totalSisaPokok: 0,
          jumlahPeminjam: 0,
        });
      }

      const sentra = sentraMap.get(sentraName);
      sentra.totalAnggota += 1;

      const simpanan = savingsByMember.get(m.id) || 0;
      sentra.totalSimpanan += simpanan;

      const loan = loansByMember.get(m.id);
      if (loan) {
        sentra.totalPinjaman += loan.jumlahPinjaman;
        sentra.totalSisaPokok += loan.sisaPokok;
        sentra.jumlahPeminjam += loan.count;
      }
    }

    const rekapList = Array.from(sentraMap.values()).sort((a, b) => b.totalSimpanan - a.totalSimpanan);

    const totalAnggota = rekapList.reduce((acc, curr) => acc + curr.totalAnggota, 0);
    const totalSimpanan = rekapList.reduce((acc, curr) => acc + curr.totalSimpanan, 0);
    const totalPinjaman = rekapList.reduce((acc, curr) => acc + curr.totalPinjaman, 0);
    const totalSisaPokok = rekapList.reduce((acc, curr) => acc + curr.totalSisaPokok, 0);

    return {
      ringkasan: {
        totalSentra: rekapList.length,
        totalAnggota,
        totalSimpanan,
        totalPinjaman,
        totalSisaPokok,
      },
      detail: rekapList,
    };
  }

  // 6. Laporan SHU (Sisa Hasil Usaha)
  static async getLaporanSHU({ totalSHU = 50000000, persenJasaModal = 50, persenJasaUsaha = 50 } = {}) {
    const totalShuNum = Number(totalSHU) || 50000000;
    const pModal = Number(persenJasaModal) || 50;
    const pUsaha = Number(persenJasaUsaha) || 50;

    const alokasiJasaModal = (totalShuNum * pModal) / 100;
    const alokasiJasaUsaha = (totalShuNum * pUsaha) / 100;

    // Ambil data anggota aktif
    const memberList = await db
      .select({
        id: members.id,
        noAnggota: members.no_anggota,
        nama: members.nama_lengkap,
      })
      .from(members)
      .where(eq(members.status_keanggotaan, "active"));

    // Saldo simpanan per anggota
    const savingRows = await db
      .select({
        memberId: rekeningSimpanan.member_id,
        saldo: sql`COALESCE(SUM(${rekeningSimpanan.saldo}), 0)`,
      })
      .from(rekeningSimpanan)
      .groupBy(rekeningSimpanan.member_id);

    // Total angsuran/pinjaman per anggota
    const loanRows = await db
      .select({
        memberId: pengajuanPinjaman.member_id,
        totalPinjaman: sql`COALESCE(SUM(${pengajuanPinjaman.jumlah_pinjaman}), 0)`,
      })
      .from(pengajuanPinjaman)
      .where(sql`${pengajuanPinjaman.status} IN ('dicairkan', 'lunas')`)
      .groupBy(pengajuanPinjaman.member_id);

    const savingMap = new Map();
    let totalAllSimpanan = 0;
    for (const s of savingRows) {
      const val = Number(s.saldo || 0);
      savingMap.set(s.memberId, val);
      totalAllSimpanan += val;
    }

    const loanMap = new Map();
    let totalAllPinjaman = 0;
    for (const l of loanRows) {
      const val = Number(l.totalPinjaman || 0);
      loanMap.set(l.memberId, val);
      totalAllPinjaman += val;
    }

    const resultList = memberList.map((m) => {
      const mySimpanan = savingMap.get(m.id) || 0;
      const myPinjaman = loanMap.get(m.id) || 0;

      const shuModal = totalAllSimpanan > 0 ? Math.round((mySimpanan / totalAllSimpanan) * alokasiJasaModal) : 0;
      const shuUsaha = totalAllPinjaman > 0 ? Math.round((myPinjaman / totalAllPinjaman) * alokasiJasaUsaha) : 0;
      const totalShuAnggota = shuModal + shuUsaha;

      return {
        memberId: m.id,
        noAnggota: m.noAnggota,
        nama: m.nama,
        totalSimpanan: mySimpanan,
        totalPinjaman: myPinjaman,
        shuJasaModal: shuModal,
        shuJasaUsaha: shuUsaha,
        totalShu: totalShuAnggota,
      };
    });

    resultList.sort((a, b) => b.totalShu - a.totalShu);

    return {
      parameter: {
        totalSHUDidistribusikan: totalShuNum,
        persenJasaModal: pModal,
        alokasiJasaModal,
        persenJasaUsaha: pUsaha,
        alokasiJasaUsaha,
        totalSemuaSimpanan: totalAllSimpanan,
        totalSemuaPinjaman: totalAllPinjaman,
      },
      detail: resultList,
    };
  }
}
