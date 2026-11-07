/**
 * Engine Perhitungan Bunga & Angsuran Pinjaman Koperasi
 * Mendukung metode: Flat, Menurun (Efektif), dan Anuitas
 */
export class PinjamanCalculator {
  /**
   * Menghitung rincian jadwal cicilan
   * @param {Object} params
   * @param {number} params.jumlahPinjaman - Nilai pokok pinjaman (P)
   * @param {number} params.tenorBulan - Jangka waktu dalam bulan (n)
   * @param {number} params.sukuBungaTahunan - Suku bunga tahunan dalam persen (r, e.g. 12 untuk 12%)
   * @param {"flat"|"menurun"|"anuitas"} params.metodeBunga - Metode perhitungan bunga
   * @param {Date} [params.tanggalMulai] - Tanggal mulai pinjaman (default: hari ini)
   */
  static hitungJadwal({
    jumlahPinjaman,
    tenorBulan,
    sukuBungaTahunan,
    metodeBunga = "flat",
    tanggalMulai = new Date(),
  }) {
    const P = Number(jumlahPinjaman);
    const n = Number(tenorBulan);
    const r = Number(sukuBungaTahunan);

    if (isNaN(P) || P <= 0) throw new Error("Jumlah pinjaman tidak valid");
    if (isNaN(n) || n <= 0) throw new Error("Tenor bulan tidak valid");
    if (isNaN(r) || r < 0) throw new Error("Suku bunga tidak valid");

    const i = r / 100 / 12; // Suku bunga per bulan
    const jadwal = [];
    let sisaPokok = P;
    let totalBunga = 0;

    const startDate = new Date(tanggalMulai);

    if (metodeBunga === "flat") {
      // 1. METODE FLAT
      const pokokPerBulan = Math.floor((P / n) * 100) / 100;
      const bungaPerBulan = Math.round(((P * (r / 100)) / 12) * 100) / 100;

      for (let bln = 1; bln <= n; bln++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + bln);

        let pokokBulanIni = pokokPerBulan;
        if (bln === n) {
          // Penyesuaian desimal di bulan terakhir
          pokokBulanIni = Math.round(sisaPokok * 100) / 100;
        }

        sisaPokok = Math.max(0, Math.round((sisaPokok - pokokBulanIni) * 100) / 100);
        const totalAngsuran = Math.round((pokokBulanIni + bungaPerBulan) * 100) / 100;
        totalBunga += bungaPerBulan;

        jadwal.push({
          angsuranKe: bln,
          tanggalJatuhTempo: dueDate.toISOString().slice(0, 10),
          pokok: pokokBulanIni,
          bunga: bungaPerBulan,
          totalAngsuran,
          sisaPokok,
        });
      }
    } else if (metodeBunga === "menurun") {
      // 2. METODE MENURUN / EFEKTIF
      const pokokPerBulan = Math.floor((P / n) * 100) / 100;

      for (let bln = 1; bln <= n; bln++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + bln);

        const bungaBulanIni = Math.round(sisaPokok * i * 100) / 100;
        let pokokBulanIni = pokokPerBulan;

        if (bln === n) {
          pokokBulanIni = Math.round(sisaPokok * 100) / 100;
        }

        sisaPokok = Math.max(0, Math.round((sisaPokok - pokokBulanIni) * 100) / 100);
        const totalAngsuran = Math.round((pokokBulanIni + bungaBulanIni) * 100) / 100;
        totalBunga += bungaBulanIni;

        jadwal.push({
          angsuranKe: bln,
          tanggalJatuhTempo: dueDate.toISOString().slice(0, 10),
          pokok: pokokBulanIni,
          bunga: bungaBulanIni,
          totalAngsuran,
          sisaPokok,
        });
      }
    } else if (metodeBunga === "anuitas") {
      // 3. METODE ANUITAS: A = P * [ i / (1 - (1+i)^-n) ]
      let angsuranBulanan = 0;
      if (i === 0) {
        angsuranBulanan = P / n;
      } else {
        angsuranBulanan = (P * i) / (1 - Math.pow(1 + i, -n));
      }
      angsuranBulanan = Math.round(angsuranBulanan * 100) / 100;

      for (let bln = 1; bln <= n; bln++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + bln);

        const bungaBulanIni = Math.round(sisaPokok * i * 100) / 100;
        let pokokBulanIni = Math.round((angsuranBulanan - bungaBulanIni) * 100) / 100;

        if (bln === n || pokokBulanIni > sisaPokok) {
          pokokBulanIni = Math.round(sisaPokok * 100) / 100;
        }

        sisaPokok = Math.max(0, Math.round((sisaPokok - pokokBulanIni) * 100) / 100);
        const totalAngsuran = Math.round((pokokBulanIni + bungaBulanIni) * 100) / 100;
        totalBunga += bungaBulanIni;

        jadwal.push({
          angsuranKe: bln,
          tanggalJatuhTempo: dueDate.toISOString().slice(0, 10),
          pokok: pokokBulanIni,
          bunga: bungaBulanIni,
          totalAngsuran,
          sisaPokok,
        });
      }
    } else {
      throw new Error(`Metode bunga '${metodeBunga}' tidak dikenali`);
    }

    totalBunga = Math.round(totalBunga * 100) / 100;
    const totalKewajiban = Math.round((P + totalBunga) * 100) / 100;
    const estimasiAngsuranBulanan =
      jadwal.length > 0 ? jadwal[0].totalAngsuran : 0;

    return {
      jumlahPinjaman: P,
      tenorBulan: n,
      sukuBungaTahunan: r,
      metodeBunga,
      estimasiAngsuranBulanan,
      totalBunga,
      totalKewajiban,
      jadwal,
    };
  }
}
