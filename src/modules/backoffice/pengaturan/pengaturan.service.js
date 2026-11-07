import { db } from "../../../db/index.js";
import {
  profilKoperasi,
  pengaturanNotifikasi,
  pengaturanKeamanan,
  pengaturanLaporan,
} from "../../../db/schema/settings.js";
import { eq } from "drizzle-orm";
import {
  formatProfil,
  formatNotifikasi,
  formatKeamanan,
  formatLaporan,
} from "./pengaturan.formatters.js";

export class PengaturanService {
  // ── 1. PROFIL KOPERASI ───────────────────────────────────────────────────
  static async getProfil() {
    let rows = await db.select().from(profilKoperasi).limit(1);
    if (!rows || rows.length === 0) {
      const inserted = await db.insert(profilKoperasi).values({}).returning();
      rows = inserted;
    }
    return formatProfil(rows[0]);
  }

  static async updateProfil(data) {
    let existing = await db.select().from(profilKoperasi).limit(1);
    const updateValues = {
      nama: data.nama,
      singkatan: data.singkatan,
      tagline: data.tagline,
      alamat: data.alamat,
      kota: data.kota,
      provinsi: data.provinsi,
      kode_pos: data.kodePos ?? data.kode_pos,
      no_telp: data.noTelp ?? data.no_telp,
      email: data.email,
      website: data.website,
      no_sk: data.noSK ?? data.no_sk,
      tanggal_berdiri: data.tanggalBerdiri ?? data.tanggal_berdiri,
      npwp: data.npwp,
      bank_nama: data.bankNama ?? data.bank_nama,
      bank_no_rekening: data.bankNoRekening ?? data.bank_no_rekening,
      bank_atas_nama: data.bankAtasNama ?? data.bank_atas_nama,
      logo_url: data.logoUrl ?? data.logo_url,
      updated_at: new Date(),
    };

    Object.keys(updateValues).forEach(
      (k) => updateValues[k] === undefined && delete updateValues[k]
    );

    let result;
    if (existing && existing.length > 0) {
      const updated = await db
        .update(profilKoperasi)
        .set(updateValues)
        .where(eq(profilKoperasi.id, existing[0].id))
        .returning();
      result = updated[0];
    } else {
      const inserted = await db
        .insert(profilKoperasi)
        .values(updateValues)
        .returning();
      result = inserted[0];
    }

    return formatProfil(result);
  }

  // ── 2. PENGATURAN NOTIFIKASI ─────────────────────────────────────────────
  static async getNotifikasi() {
    let rows = await db.select().from(pengaturanNotifikasi).limit(1);
    if (!rows || rows.length === 0) {
      const inserted = await db.insert(pengaturanNotifikasi).values({}).returning();
      rows = inserted;
    }
    return formatNotifikasi(rows[0]);
  }

  static async updateNotifikasi(data) {
    let existing = await db.select().from(pengaturanNotifikasi).limit(1);
    const updateValues = {
      email_aktif: data.emailAktif ?? data.email_aktif,
      email_host: data.emailHost ?? data.email_host,
      email_port: data.emailPort ?? data.email_port,
      email_user: data.emailUser ?? data.email_user,
      email_password: data.emailPassword ?? data.email_password,
      email_pengirim: data.emailPengirim ?? data.email_pengirim,
      nama_pengirim: data.namaPengirim ?? data.nama_pengirim,
      email_ssl: data.emailSsl ?? data.email_ssl,
      template_pengajuan: data.templatePengajuan ?? data.template_pengajuan,
      template_disetujui: data.templateDisetujui ?? data.template_disetujui,
      template_ditolak: data.templateDitolak ?? data.template_ditolak,
      whatsapp_aktif: data.whatsappAktif ?? data.whatsapp_aktif,
      whatsapp_provider: data.whatsappProvider ?? data.whatsapp_provider,
      whatsapp_api_key: data.whatsappApiKey ?? data.whatsapp_api_key,
      whatsapp_nomor_pengirim: data.whatsappNomorPengirim ?? data.whatsapp_nomor_pengirim,
      whatsapp_nomor_admin: data.whatsappNomorAdmin ?? data.whatsapp_nomor_admin,
      template_wa_pengajuan: data.templateWaPengajuan ?? data.template_wa_pengajuan,
      template_wa_status: data.templateWaStatus ?? data.template_wa_status,
      template_wa_jatuh_tempo: data.templateWaJatuhTempo ?? data.template_wa_jatuh_tempo,
      updated_at: new Date(),
    };

    Object.keys(updateValues).forEach(
      (k) => updateValues[k] === undefined && delete updateValues[k]
    );

    let result;
    if (existing && existing.length > 0) {
      const updated = await db
        .update(pengaturanNotifikasi)
        .set(updateValues)
        .where(eq(pengaturanNotifikasi.id, existing[0].id))
        .returning();
      result = updated[0];
    } else {
      const inserted = await db
        .insert(pengaturanNotifikasi)
        .values(updateValues)
        .returning();
      result = inserted[0];
    }

    return formatNotifikasi(result);
  }

  // ── 3. PENGATURAN KEAMANAN ───────────────────────────────────────────────
  static async getKeamanan() {
    let rows = await db.select().from(pengaturanKeamanan).limit(1);
    if (!rows || rows.length === 0) {
      const inserted = await db.insert(pengaturanKeamanan).values({}).returning();
      rows = inserted;
    }
    return formatKeamanan(rows[0]);
  }

  static async updateKeamanan(data) {
    let existing = await db.select().from(pengaturanKeamanan).limit(1);
    const updateValues = {
      session_timeout: data.sessionTimeout ?? data.session_timeout,
      max_login_attempts: data.maxLoginAttempts ?? data.max_login_attempts,
      log_aktivitas: data.logAktivitas ?? data.log_aktivitas,
      mfa_enabled: data.mfaEnabled ?? data.mfa_enabled,
      password_min_length: data.passwordMinLength ?? data.password_min_length,
      updated_at: new Date(),
    };

    Object.keys(updateValues).forEach(
      (k) => updateValues[k] === undefined && delete updateValues[k]
    );

    let result;
    if (existing && existing.length > 0) {
      const updated = await db
        .update(pengaturanKeamanan)
        .set(updateValues)
        .where(eq(pengaturanKeamanan.id, existing[0].id))
        .returning();
      result = updated[0];
    } else {
      const inserted = await db
        .insert(pengaturanKeamanan)
        .values(updateValues)
        .returning();
      result = inserted[0];
    }

    return formatKeamanan(result);
  }

  // ── 4. PENGATURAN LAPORAN & BACKUP ────────────────────────────────────────
  static async getLaporan() {
    let rows = await db.select().from(pengaturanLaporan).limit(1);
    if (!rows || rows.length === 0) {
      const inserted = await db.insert(pengaturanLaporan).values({}).returning();
      rows = inserted;
    }
    return formatLaporan(rows[0]);
  }

  static async updateLaporan(data) {
    let existing = await db.select().from(pengaturanLaporan).limit(1);
    const updateValues = {
      format_default: data.formatDefault ?? data.format_default,
      jadwal_backup: data.jadwalBackup ?? data.jadwal_backup,
      retensi_backup: data.retensiBackup ?? data.retensi_backup,
      auto_backup: data.autoBackup ?? data.auto_backup,
      updated_at: new Date(),
    };

    Object.keys(updateValues).forEach(
      (k) => updateValues[k] === undefined && delete updateValues[k]
    );

    let result;
    if (existing && existing.length > 0) {
      const updated = await db
        .update(pengaturanLaporan)
        .set(updateValues)
        .where(eq(pengaturanLaporan.id, existing[0].id))
        .returning();
      result = updated[0];
    } else {
      const inserted = await db
        .insert(pengaturanLaporan)
        .values(updateValues)
        .returning();
      result = inserted[0];
    }

    return formatLaporan(result);
  }

  // ── 5. ALL-IN-ONE BUNDLE GET & UPDATE ─────────────────────────────────────
  static async getAll() {
    const [profil, notifikasi, keamanan, laporan] = await Promise.all([
      this.getProfil(),
      this.getNotifikasi(),
      this.getKeamanan(),
      this.getLaporan(),
    ]);

    return { profil, notifikasi, keamanan, laporan };
  }

  static async updateAll(bundle) {
    const promises = [];
    if (bundle.profil) promises.push(this.updateProfil(bundle.profil));
    if (bundle.notifikasi) promises.push(this.updateNotifikasi(bundle.notifikasi));
    if (bundle.keamanan) promises.push(this.updateKeamanan(bundle.keamanan));
    if (bundle.laporan) promises.push(this.updateLaporan(bundle.laporan));

    await Promise.all(promises);
    return await this.getAll();
  }
}
