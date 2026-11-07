import { eq, desc, count, and, or, ilike, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  jenisSimpanan,
  rekeningSimpanan,
  mutasiSimpanan,
} from "../../db/schema/simpanan.js";
import { members } from "../../db/schema/members.js";
import { users } from "../../db/schema/users.js";
import { outbox } from "../../db/schema/outbox.js";
import { ApiError } from "../../utils/errors.js";

export class SimpananService {
  // 1. Get Master Jenis Simpanan
  static async getJenisSimpananList() {
    return await db
      .select()
      .from(jenisSimpanan)
      .where(eq(jenisSimpanan.is_active, true))
      .orderBy(jenisSimpanan.created_at);
  }

  // 2. Create Master Jenis Simpanan (Admin / BO)
  static async createJenisSimpanan(input) {
    const existing = await db
      .select({ id: jenisSimpanan.id })
      .from(jenisSimpanan)
      .where(eq(jenisSimpanan.kode, input.kode))
      .limit(1);

    if (existing.length > 0) {
      throw ApiError.conflict(`Jenis simpanan dengan kode '${input.kode}' sudah ada`);
    }

    const minimalSetoran = input.minimal_setoran ?? input.minimalSetoran ?? 0;
    const isWajib = input.is_wajib ?? input.isWajib ?? false;

    const [created] = await db
      .insert(jenisSimpanan)
      .values({
        kode: input.kode,
        nama: input.nama,
        tipe: input.tipe,
        minimal_setoran: minimalSetoran.toString(),
        deskripsi: input.deskripsi,
        is_wajib: isWajib,
      })
      .returning();

    return created;
  }

  // 3. Buka Rekening Simpanan untuk Anggota
  static async bukaRekening({ memberId, jenisSimpananId }) {
    const mId = memberId;
    const jsId = jenisSimpananId;

    // Validasi member
    const memberExists = await db
      .select({ id: members.id, no_anggota: members.no_anggota, status: members.status_keanggotaan })
      .from(members)
      .where(eq(members.id, mId))
      .limit(1);

    if (memberExists.length === 0) {
      throw ApiError.notFound("Anggota tidak ditemukan");
    }

    if (memberExists[0].status !== "active") {
      throw ApiError.badRequest("Status keanggotaan belum aktif untuk membuka rekening");
    }

    // Validasi jenis simpanan
    const jenis = await db
      .select()
      .from(jenisSimpanan)
      .where(and(eq(jenisSimpanan.id, jsId), eq(jenisSimpanan.is_active, true)))
      .limit(1);

    if (jenis.length === 0) {
      throw ApiError.notFound("Jenis simpanan tidak ditemukan atau tidak aktif");
    }

    // Cek apakah jenis simpanan ini adalah pokok/wajib dan sudah pernah dibuka
    if (jenis[0].tipe === "pokok" || jenis[0].tipe === "wajib") {
      const existingRek = await db
        .select({ id: rekeningSimpanan.id })
        .from(rekeningSimpanan)
        .where(
          and(
            eq(rekeningSimpanan.member_id, mId),
            eq(rekeningSimpanan.jenis_simpanan_id, jsId),
            eq(rekeningSimpanan.status, "aktif")
          )
        )
        .limit(1);

      if (existingRek.length > 0) {
        throw ApiError.conflict(
          `Anggota sudah memiliki rekening aktif untuk ${jenis[0].nama}`
        );
      }
    }

    // Generate Nomor Rekening Unik: e.g., SP-2026-XXXXX
    const year = new Date().getFullYear();
    const randomHex = Math.floor(10000 + Math.random() * 90000);
    const nomorRekening = `${jenis[0].kode}-${year}-${randomHex}`;

    const [newRekening] = await db
      .insert(rekeningSimpanan)
      .values({
        member_id: mId,
        jenis_simpanan_id: jsId,
        nomor_rekening: nomorRekening,
        saldo: "0.00",
        status: "aktif",
      })
      .returning();

    return {
      ...newRekening,
      jenisSimpanan: jenis[0],
    };
  }

  // 4. Get Rekening List untuk Member
  static async getRekeningByMember(memberId) {
    const list = await db
      .select({
        id: rekeningSimpanan.id,
        nomor_rekening: rekeningSimpanan.nomor_rekening,
        saldo: rekeningSimpanan.saldo,
        status: rekeningSimpanan.status,
        created_at: rekeningSimpanan.created_at,
        jenis: {
          id: jenisSimpanan.id,
          kode: jenisSimpanan.kode,
          nama: jenisSimpanan.nama,
          tipe: jenisSimpanan.tipe,
        },
      })
      .from(rekeningSimpanan)
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .where(eq(rekeningSimpanan.member_id, memberId))
      .orderBy(jenisSimpanan.tipe);

    return list;
  }

  // 4b. Get Ringkasan Rekening Kasir untuk Anggota (Semua Jenis Simpanan & Status Rekening)
  static async getRekeningByMemberForCashier(memberId) {
    // 1. Ambil data anggota
    const [member] = await db
      .select({
        id: members.id,
        noAnggota: members.no_anggota,
        namaLengkap: members.nama_lengkap,
        nik: members.nik,
        noHp: members.no_hp,
        statusKeanggotaan: members.status_keanggotaan,
      })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      throw ApiError.notFound("Data anggota tidak ditemukan");
    }

    // 2. Ambil seluruh master jenis simpanan
    const allJenis = await db
      .select()
      .from(jenisSimpanan)
      .where(eq(jenisSimpanan.is_active, true))
      .orderBy(jenisSimpanan.tipe);

    // 3. Ambil rekening aktif anggota
    const memberRekening = await db
      .select({
        id: rekeningSimpanan.id,
        nomorRekening: rekeningSimpanan.nomor_rekening,
        jenisSimpananId: rekeningSimpanan.jenis_simpanan_id,
        saldo: rekeningSimpanan.saldo,
        status: rekeningSimpanan.status,
      })
      .from(rekeningSimpanan)
      .where(and(eq(rekeningSimpanan.member_id, memberId), eq(rekeningSimpanan.status, "aktif")));

    // 4. Map gabungan jenis simpanan & rekening anggota
    const rekeningSummary = allJenis.map((j) => {
      const existing = memberRekening.find((r) => r.jenisSimpananId === j.id);
      return {
        jenisId: j.id,
        kode: j.kode,
        nama: j.nama,
        tipe: j.tipe,
        minimalSetoran: Number(j.minimal_setoran),
        isWajib: j.is_wajib,
        rekeningId: existing ? existing.id : null,
        nomorRekening: existing ? existing.nomorRekening : null,
        saldo: existing ? Number(existing.saldo) : 0,
        hasAccount: Boolean(existing),
      };
    });

    const totalSaldo = rekeningSummary.reduce((sum, r) => sum + r.saldo, 0);

    return {
      anggota: member,
      rekening: rekeningSummary,
      totalSaldo,
    };
  }

  // 5. Get Detail Rekening
  static async getRekeningDetail(rekeningId) {
    const rows = await db
      .select({
        id: rekeningSimpanan.id,
        member_id: rekeningSimpanan.member_id,
        nomor_rekening: rekeningSimpanan.nomor_rekening,
        saldo: rekeningSimpanan.saldo,
        status: rekeningSimpanan.status,
        created_at: rekeningSimpanan.created_at,
        jenis: {
          id: jenisSimpanan.id,
          kode: jenisSimpanan.kode,
          nama: jenisSimpanan.nama,
          tipe: jenisSimpanan.tipe,
        },
        pemilik: {
          id: members.id,
          no_anggota: members.no_anggota,
          nama_lengkap: members.nama_lengkap,
        },
      })
      .from(rekeningSimpanan)
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .innerJoin(members, eq(rekeningSimpanan.member_id, members.id))
      .where(eq(rekeningSimpanan.id, rekeningId))
      .limit(1);

    if (rows.length === 0) {
      throw ApiError.notFound("Rekening simpanan tidak ditemukan");
    }

    return rows[0];
  }

  // 6. Get Mutasi Simpanan (Paginasi)
  static async getMutasiByRekening(rekeningId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const [totalRows] = await db
      .select({ count: count() })
      .from(mutasiSimpanan)
      .where(eq(mutasiSimpanan.rekening_id, rekeningId));

    const total = Number(totalRows.count);
    const totalPages = Math.ceil(total / limit);

    const items = await db
      .select()
      .from(mutasiSimpanan)
      .where(eq(mutasiSimpanan.rekening_id, rekeningId))
      .orderBy(desc(mutasiSimpanan.tanggal_transaksi))
      .limit(limit)
      .offset(offset);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // 7. Transaksi Setor / Tarik Simpanan (ACID Transaction)
  static async transaksiSetorTarik(input, operatorId) {
    const rawNominal = input.nominal !== undefined ? input.nominal : input.jumlah;
    const nominal = Number(rawNominal);
    if (isNaN(nominal) || nominal <= 0) {
      throw ApiError.badRequest("Nominal transaksi harus lebih dari 0");
    }

    let rekeningId = input.rekening_id || input.rekeningId;
    const memberId = input.member_id || input.memberId;
    const jenisSimpananId = input.jenis_simpanan_id || input.jenisSimpananId;
    const jenisMutasi = input.jenis_mutasi || input.jenisMutasi;
    const metodePembayaran = input.metode_pembayaran || input.metodePembayaran || "tunai";
    const buktiPembayaran = input.bukti_pembayaran || input.buktiPembayaran || null;

    if (!rekeningId && (!memberId || !jenisSimpananId)) {
      throw ApiError.badRequest("Harus menyertakan rekeningId atau memberId beserta jenisSimpananId");
    }

    return await db.transaction(async (tx) => {
      // Jika rekeningId belum ada, cari berdasarkan memberId & jenisSimpananId
      if (!rekeningId) {
        const [existingRek] = await tx
          .select()
          .from(rekeningSimpanan)
          .where(
            and(
              eq(rekeningSimpanan.member_id, memberId),
              eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpananId),
              eq(rekeningSimpanan.status, "aktif")
            )
          )
          .limit(1);

        if (existingRek) {
          rekeningId = existingRek.id;
        } else {
          // Jika transaksi setor, otomatis buka rekening baru
          if (jenisMutasi === "setor") {
            const [jenis] = await tx
              .select()
              .from(jenisSimpanan)
              .where(eq(jenisSimpanan.id, jenisSimpananId))
              .limit(1);

            if (!jenis) {
              throw ApiError.notFound("Jenis simpanan tidak ditemukan");
            }

            const year = new Date().getFullYear();
            const randomHex = Math.floor(10000 + Math.random() * 90000);
            const nomorRekening = `${jenis.kode}-${year}-${randomHex}`;

            const [newRek] = await tx
              .insert(rekeningSimpanan)
              .values({
                member_id: memberId,
                jenis_simpanan_id: jenisSimpananId,
                nomor_rekening: nomorRekening,
                saldo: "0.00",
                status: "aktif",
              })
              .returning();

            rekeningId = newRek.id;
          } else {
            throw ApiError.badRequest("Anggota belum memiliki rekening aktif untuk penarikan jenis simpanan ini");
          }
        }
      }

      // 1. Ambil rekening terkini dengan lock info
      const [rek] = await tx
        .select()
        .from(rekeningSimpanan)
        .where(eq(rekeningSimpanan.id, rekeningId))
        .limit(1);

      if (!rek) {
        throw ApiError.notFound("Rekening simpanan tidak ditemukan");
      }

      if (rek.status !== "aktif") {
        throw ApiError.badRequest(`Rekening simpanan sedang dalam status '${rek.status}'`);
      }

      const saldoAwal = Number(rek.saldo);
      let saldoAkhir = saldoAwal;

      if (jenisMutasi === "setor") {
        saldoAkhir = saldoAwal + nominal;
      } else if (jenisMutasi === "tarik") {
        if (saldoAwal < nominal) {
          throw ApiError.badRequest(
            `Saldo tidak mencukupi untuk penarikan ini. Saldo saat ini: Rp ${saldoAwal.toLocaleString("id-ID")}`
          );
        }
        saldoAkhir = saldoAwal - nominal;
      } else {
        throw ApiError.badRequest("Jenis mutasi harus 'setor' atau 'tarik'");
      }

      // 2. Generate kode transaksi unik
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randStr = Math.floor(1000 + Math.random() * 9000);
      const prefix = jenisMutasi === "setor" ? "STR" : "TRK";
      const kodeTransaksi = `TRX-${prefix}-${dateStr}-${randStr}`;

      // 3. Update saldo rekening
      await tx
        .update(rekeningSimpanan)
        .set({
          saldo: saldoAkhir.toFixed(2),
        })
        .where(eq(rekeningSimpanan.id, rek.id));

      // 4. Catat mutasi simpanan
      const [mutasi] = await tx
        .insert(mutasiSimpanan)
        .values({
          rekening_id: rek.id,
          operator_id: operatorId || null,
          kode_transaksi: kodeTransaksi,
          jenis_mutasi: jenisMutasi,
          nominal: nominal.toFixed(2),
          saldo_awal: saldoAwal.toFixed(2),
          saldo_akhir: saldoAkhir.toFixed(2),
          keterangan: input.keterangan || `Transaksi ${jenisMutasi} simpanan`,
          metode_pembayaran: metodePembayaran,
          bukti_pembayaran: buktiPembayaran,
        })
        .returning();

      // 5. Ambil data pendukung untuk kuitansi resmi
      const [memberInfo] = await tx
        .select({
          id: members.id,
          noAnggota: members.no_anggota,
          namaLengkap: members.nama_lengkap,
          nik: members.nik,
          noHp: members.no_hp,
          alamat: members.alamat,
        })
        .from(members)
        .where(eq(members.id, rek.member_id))
        .limit(1);

      const [jenisInfo] = await tx
        .select({
          kode: jenisSimpanan.kode,
          nama: jenisSimpanan.nama,
          tipe: jenisSimpanan.tipe,
        })
        .from(jenisSimpanan)
        .where(eq(jenisSimpanan.id, rek.jenis_simpanan_id))
        .limit(1);

      let operatorName = "Petugas Kasir";
      if (operatorId) {
        const [opUser] = await tx
          .select({ username: users.username, email: users.email })
          .from(users)
          .where(eq(users.id, operatorId))
          .limit(1);
        if (opUser?.username) operatorName = opUser.username;
      }

      // 6. Enqueue WhatsApp notification kuitansi resmi ke outbox
      if (memberInfo?.noHp) {
        const jenisLabel = jenisMutasi === "setor" ? "SETORAN" : "PENARIKAN";
        const nominalFmt = Number(nominal).toLocaleString("id-ID");
        const saldoAkhirFmt = Number(saldoAkhir).toLocaleString("id-ID");
        const tglWaktu = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

        const waMsg = `🧾 *BUKTI RESMI ${jenisLabel} SIMPANAN*
Koperasi Simpan Pinjam UPK Mekarsari

Yth. *${memberInfo.namaLengkap}* (${memberInfo.noAnggota || "-"})
Transaksi kasir Anda telah berhasil diproses:

• No. Bukti/Kuitansi: *${kodeTransaksi}*
• Jenis Transaksi: *${jenisLabel}*
• Produk: *${jenisInfo?.nama || "Simpanan"}*
• Nominal: *Rp ${nominalFmt}*
• Sisa Saldo: *Rp ${saldoAkhirFmt}*
• Waktu: *${tglWaktu}*
• Kasir: *${operatorName}*

Terima kasih telah bertransaksi di Koperasi Simpan Pinjam UPK Mekarsari.
_Simpan pesan ini sebagai bukti transaksi resmi Anda._`;

        await tx.insert(outbox).values({
          topic: "whatsapp.notification",
          event_key: `simpanan.trx.${kodeTransaksi}`,
          payload: {
            to: memberInfo.noHp,
            message: waMsg,
            type: "simpanan_transaction",
            kodeTransaksi,
            nominal,
            saldoAkhir,
          },
          status: "PENDING",
        });
      }

      return {
        mutasi,
        rekening: {
          id: rek.id,
          nomor_rekening: rek.nomor_rekening,
          saldoSebelumnya: saldoAwal,
          saldoSaatIni: saldoAkhir,
        },
        kuitansi: {
          kodeTransaksi,
          tanggalTransaksi: mutasi.tanggal_transaksi,
          jenisMutasi,
          nominal,
          saldoAwal,
          saldoAkhir,
          metodePembayaran,
          keterangan: mutasi.keterangan,
          nomorRekening: rek.nomor_rekening,
          jenisSimpanan: jenisInfo?.nama || "Simpanan",
          tipeSimpanan: jenisInfo?.tipe || "sukarela",
          namaAnggota: memberInfo?.namaLengkap || "-",
          nomorAnggota: memberInfo?.noAnggota || "-",
          nik: memberInfo?.nik || "-",
          noHp: memberInfo?.noHp || "-",
          alamat: memberInfo?.alamat || "-",
          operator: operatorName,
        },
      };
    });
  }

  // 8. Get All Transaksi Mutasi untuk Back Office (Filter, Pencarian, & Ringkasan)
  static async getAllTransaksi({
    search,
    jenisMutasi,
    tipe,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;
    const conditions = [];

    if (jenisMutasi) {
      conditions.push(eq(mutasiSimpanan.jenis_mutasi, jenisMutasi));
    }

    if (tipe) {
      conditions.push(eq(jenisSimpanan.tipe, tipe));
    }

    if (startDate) {
      conditions.push(gte(mutasiSimpanan.tanggal_transaksi, new Date(`${startDate}T00:00:00Z`)));
    }

    if (endDate) {
      conditions.push(lte(mutasiSimpanan.tanggal_transaksi, new Date(`${endDate}T23:59:59Z`)));
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          ilike(mutasiSimpanan.kode_transaksi, term),
          ilike(members.nama_lengkap, term),
          ilike(members.no_anggota, term),
          ilike(rekeningSimpanan.nomor_rekening, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Total hitungan paginasi
    const [totalRow] = await db
      .select({ count: count() })
      .from(mutasiSimpanan)
      .innerJoin(rekeningSimpanan, eq(mutasiSimpanan.rekening_id, rekeningSimpanan.id))
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .innerJoin(members, eq(rekeningSimpanan.member_id, members.id))
      .where(whereClause);

    const total = Number(totalRow?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // 2. Ringkasan agregat keseluruhan
    const [rekap] = await db
      .select({
        totalSetor: sql`COALESCE(SUM(CASE WHEN ${mutasiSimpanan.jenis_mutasi} = 'setor' THEN ${mutasiSimpanan.nominal} ELSE 0 END), 0)`,
        totalTarik: sql`COALESCE(SUM(CASE WHEN ${mutasiSimpanan.jenis_mutasi} = 'tarik' THEN ${mutasiSimpanan.nominal} ELSE 0 END), 0)`,
        jumlahTransaksi: count(),
      })
      .from(mutasiSimpanan)
      .innerJoin(rekeningSimpanan, eq(mutasiSimpanan.rekening_id, rekeningSimpanan.id))
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .innerJoin(members, eq(rekeningSimpanan.member_id, members.id))
      .where(whereClause);

    // 3. Data transaksi
    const items = await db
      .select({
        id: mutasiSimpanan.id,
        kodeTransaksi: mutasiSimpanan.kode_transaksi,
        jenisMutasi: mutasiSimpanan.jenis_mutasi,
        nominal: mutasiSimpanan.nominal,
        saldoAwal: mutasiSimpanan.saldo_awal,
        saldoAkhir: mutasiSimpanan.saldo_akhir,
        metodePembayaran: mutasiSimpanan.metode_pembayaran,
        keterangan: mutasiSimpanan.keterangan,
        tanggalTransaksi: mutasiSimpanan.tanggal_transaksi,
        rekeningId: rekeningSimpanan.id,
        nomorRekening: rekeningSimpanan.nomor_rekening,
        jenisSimpanan: {
          id: jenisSimpanan.id,
          kode: jenisSimpanan.kode,
          nama: jenisSimpanan.nama,
          tipe: jenisSimpanan.tipe,
        },
        anggota: {
          id: members.id,
          noAnggota: members.no_anggota,
          namaLengkap: members.nama_lengkap,
          nik: members.nik,
          noHp: members.no_hp,
          alamat: members.alamat,
        },
        operator: {
          id: users.id,
          username: users.username,
        },
      })
      .from(mutasiSimpanan)
      .innerJoin(rekeningSimpanan, eq(mutasiSimpanan.rekening_id, rekeningSimpanan.id))
      .innerJoin(jenisSimpanan, eq(rekeningSimpanan.jenis_simpanan_id, jenisSimpanan.id))
      .innerJoin(members, eq(rekeningSimpanan.member_id, members.id))
      .leftJoin(users, eq(mutasiSimpanan.operator_id, users.id))
      .where(whereClause)
      .orderBy(desc(mutasiSimpanan.tanggal_transaksi))
      .limit(limitNum)
      .offset(offset);

    const totalSetoran = Number(rekap?.totalSetor || 0);
    const totalPenarikan = Number(rekap?.totalTarik || 0);

    return {
      ringkasan: {
        totalSetor: totalSetoran,
        totalTarik: totalPenarikan,
        totalSaldo: totalSetoran - totalPenarikan,
        totalTransaksi: Number(rekap?.jumlahTransaksi || 0),
      },
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
