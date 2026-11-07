export const formatProfil = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    nama: p.nama,
    singkatan: p.singkatan,
    tagline: p.tagline || "",
    alamat: p.alamat || "",
    kota: p.kota || "",
    provinsi: p.provinsi || "",
    kodePos: p.kode_pos || "",
    noTelp: p.no_telp || "",
    email: p.email || "",
    website: p.website || "",
    noSK: p.no_sk || "",
    tanggalBerdiri: p.tanggal_berdiri || "",
    npwp: p.npwp || "",
    bankNama: p.bank_nama || "",
    bankNoRekening: p.bank_no_rekening || "",
    bankAtasNama: p.bank_atas_nama || "",
    logoUrl: p.logo_url || "",
  };
};

export const formatNotifikasi = (n) => {
  if (!n) return null;
  return {
    id: n.id,
    emailAktif: Boolean(n.email_aktif),
    emailHost: n.email_host || "smtp.gmail.com",
    emailPort: String(n.email_port || "587"),
    emailUser: n.email_user || "",
    emailPassword: n.email_password || "",
    emailPengirim: n.email_pengirim || "",
    namaPengirim: n.nama_pengirim || "",
    emailSsl: Boolean(n.email_ssl),
    templatePengajuan: n.template_pengajuan || "",
    templateDisetujui: n.template_disetujui || "",
    templateDitolak: n.template_ditolak || "",
    whatsappAktif: Boolean(n.whatsapp_aktif),
    whatsappProvider: n.whatsapp_provider || "fonnte",
    whatsappApiKey: n.whatsapp_api_key || "",
    whatsappNomorPengirim: n.whatsapp_nomor_pengirim || "",
    whatsappNomorAdmin: n.whatsapp_nomor_admin || "",
    templateWaPengajuan: n.template_wa_pengajuan || "",
    templateWaStatus: n.template_wa_status || "",
    templateWaJatuhTempo: n.template_wa_jatuh_tempo || "",
  };
};

export const formatKeamanan = (k) => {
  if (!k) return null;
  return {
    id: k.id,
    sessionTimeout: Number(k.session_timeout ?? 60),
    maxLoginAttempts: Number(k.max_login_attempts ?? 5),
    logAktivitas: Boolean(k.log_aktivitas),
    mfaEnabled: Boolean(k.mfa_enabled),
    passwordMinLength: Number(k.password_min_length ?? 8),
  };
};

export const formatLaporan = (l) => {
  if (!l) return null;
  return {
    id: l.id,
    formatDefault: l.format_default || "excel",
    jadwalBackup: l.jadwal_backup || "harian",
    retensiBackup: Number(l.retensi_backup ?? 30),
    autoBackup: Boolean(l.auto_backup),
  };
};
