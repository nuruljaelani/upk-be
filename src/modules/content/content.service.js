import { db } from "../../db/index.js";
import {
  siteSettings,
  heroContent,
  layananItems,
  beritaItems,
  tentangKami,
  testimoniItems,
} from "../../db/schema/content.js";
import { eq, asc, desc } from "drizzle-orm";

const formatSettings = (s) => {
  if (!s) return null;
  return {
    namaOrganisasi: s.nama_organisasi,
    tagline: s.tagline || "",
    deskripsiSingkat: s.deskripsi_singkat || "",
    alamat: s.alamat || "",
    telepon: s.telepon || "",
    whatsapp: s.whatsapp || "",
    email: s.email || "",
    emailCs: s.email_cs || "",
    jamOperasional: s.jam_operasional || "",
    jamSabtu: s.jam_sabtu || "",
    facebook: s.facebook || "",
    instagram: s.instagram || "",
    youtube: s.youtube || "",
    googleMapsUrl: s.google_maps_url || "",
  };
};

const formatHero = (h) => {
  if (!h) return null;
  return {
    judul: h.judul,
    subjudul: h.subjudul || "",
    labelTombol: h.label_tombol || "Aktivasi Akun",
    hrefTombol: h.href_tombol || "/aktivasi",
    statAnggota: h.stat_anggota || "2000+",
    statTahun: h.stat_tahun || "20+",
    statRating: h.stat_rating || "98%",
  };
};

const formatLayanan = (l) => ({
  id: l.id,
  judul: l.judul,
  deskripsi: l.deskripsi,
  warnaBorder: l.warna_border || "border-green-700",
  warnaIkon: l.warna_ikon || "text-green-700",
  urutan: l.urutan ?? 0,
});

const formatBerita = (b) => ({
  id: b.id,
  judul: b.judul,
  slug: b.slug || "",
  kategori: b.kategori || "Umum",
  tanggal: b.tanggal || "",
  excerpt: b.excerpt || "",
  konten: b.konten || "",
  gambar: b.gambar || "",
  isUtama: Boolean(b.is_utama),
  status: b.status || "published",
});

const formatTentang = (t) => {
  if (!t) return null;
  return {
    visi: t.visi || "",
    misi: Array.isArray(t.misi) ? t.misi : [],
    deskripsi: t.deskripsi || "",
    deskripsiParagraf2: t.deskripsi_paragraf_2 || "",
    poinKeunggulan: Array.isArray(t.poin_keunggulan) ? t.poin_keunggulan : [],
  };
};

const formatTestimoni = (item) => ({
  id: item.id,
  nama: item.nama,
  teks: item.teks,
  bintang: item.bintang ?? 5,
  jabatan: item.jabatan || "Anggota",
  foto: item.foto || "",
});

export class ContentService {
  /**
   * Mengambil semua konten publik dalam satu panggilan (untuk landing page & public routes)
   */
  static async getPublicContent() {
    const [settingsList, heroList, layananList, beritaList, tentangList, testimoniList] =
      await Promise.all([
        db.select().from(siteSettings).where(eq(siteSettings.id, "main")).limit(1),
        db.select().from(heroContent).where(eq(heroContent.id, "main")).limit(1),
        db.select().from(layananItems).where(eq(layananItems.is_active, true)).orderBy(asc(layananItems.urutan)),
        db.select().from(beritaItems).where(eq(beritaItems.status, "published")).orderBy(desc(beritaItems.created_at)).limit(10),
        db.select().from(tentangKami).where(eq(tentangKami.id, "main")).limit(1),
        db.select().from(testimoniItems).where(eq(testimoniItems.is_active, true)).orderBy(desc(testimoniItems.created_at)),
      ]);

    return {
      settings: formatSettings(settingsList[0]),
      hero: formatHero(heroList[0]),
      layanan: layananList.map(formatLayanan),
      berita: beritaList.map(formatBerita),
      tentang: formatTentang(tentangList[0]),
      testimoni: testimoniList.map(formatTestimoni),
    };
  }

  // --- Site Settings ---
  static async getSettings() {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, "main")).limit(1);
    return formatSettings(rows[0]);
  }

  static async updateSettings(data) {
    const payload = {
      nama_organisasi: data.namaOrganisasi,
      tagline: data.tagline,
      deskripsi_singkat: data.deskripsiSingkat,
      alamat: data.alamat,
      telepon: data.telepon,
      whatsapp: data.whatsapp,
      email: data.email,
      email_cs: data.emailCs,
      jam_operasional: data.jamOperasional,
      jam_sabtu: data.jamSabtu,
      facebook: data.facebook,
      instagram: data.instagram,
      youtube: data.youtube,
      google_maps_url: data.googleMapsUrl,
      updated_at: new Date(),
    };

    const existing = await db.select().from(siteSettings).where(eq(siteSettings.id, "main")).limit(1);
    if (existing.length === 0) {
      await db.insert(siteSettings).values({ id: "main", ...payload });
    } else {
      await db.update(siteSettings).set(payload).where(eq(siteSettings.id, "main"));
    }
    return this.getSettings();
  }

  // --- Hero Content ---
  static async getHero() {
    const rows = await db.select().from(heroContent).where(eq(heroContent.id, "main")).limit(1);
    return formatHero(rows[0]);
  }

  static async updateHero(data) {
    const payload = {
      judul: data.judul,
      subjudul: data.subjudul,
      label_tombol: data.labelTombol,
      href_tombol: data.hrefTombol,
      stat_anggota: data.statAnggota,
      stat_tahun: data.statTahun,
      stat_rating: data.statRating,
      updated_at: new Date(),
    };

    const existing = await db.select().from(heroContent).where(eq(heroContent.id, "main")).limit(1);
    if (existing.length === 0) {
      await db.insert(heroContent).values({ id: "main", ...payload });
    } else {
      await db.update(heroContent).set(payload).where(eq(heroContent.id, "main"));
    }
    return this.getHero();
  }

  // --- Layanan ---
  static async getLayananList(includeInactive = false) {
    let query = db.select().from(layananItems);
    if (!includeInactive) {
      query = query.where(eq(layananItems.is_active, true));
    }
    const rows = await query.orderBy(asc(layananItems.urutan));
    return rows.map(formatLayanan);
  }

  static async createLayanan(data) {
    const [inserted] = await db.insert(layananItems).values({
      judul: data.judul,
      deskripsi: data.deskripsi,
      warna_border: data.warnaBorder || "border-green-700",
      warna_ikon: data.warnaIkon || "text-green-700",
      urutan: data.urutan ?? 0,
      is_active: data.isActive ?? true,
    }).returning();
    return formatLayanan(inserted);
  }

  static async updateLayanan(id, data) {
    const payload = {};
    if (data.judul !== undefined) payload.judul = data.judul;
    if (data.deskripsi !== undefined) payload.deskripsi = data.deskripsi;
    if (data.warnaBorder !== undefined) payload.warna_border = data.warnaBorder;
    if (data.warnaIkon !== undefined) payload.warna_ikon = data.warnaIkon;
    if (data.urutan !== undefined) payload.urutan = data.urutan;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date();

    const [updated] = await db.update(layananItems).set(payload).where(eq(layananItems.id, id)).returning();
    return updated ? formatLayanan(updated) : null;
  }

  static async deleteLayanan(id) {
    await db.delete(layananItems).where(eq(layananItems.id, id));
    return { success: true };
  }

  // --- Berita ---
  static async getBeritaList({ status, limit = 50 } = {}) {
    let query = db.select().from(beritaItems);
    if (status) {
      query = query.where(eq(beritaItems.status, status));
    }
    const rows = await query.orderBy(desc(beritaItems.created_at)).limit(limit);
    return rows.map(formatBerita);
  }

  static async getBeritaByIdOrSlug(idOrSlug) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
      const byId = await db.select().from(beritaItems).where(eq(beritaItems.id, idOrSlug)).limit(1);
      if (byId.length > 0) return formatBerita(byId[0]);
    }

    const bySlug = await db.select().from(beritaItems).where(eq(beritaItems.slug, idOrSlug)).limit(1);
    return bySlug.length > 0 ? formatBerita(bySlug[0]) : null;
  }

  static async createBerita(data) {
    const slug = data.slug || data.judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [inserted] = await db.insert(beritaItems).values({
      judul: data.judul,
      slug,
      kategori: data.kategori || "Umum",
      tanggal: data.tanggal || new Date().toISOString().split("T")[0],
      excerpt: data.excerpt || "",
      konten: data.konten || "",
      gambar: data.gambar || "",
      is_utama: data.isUtama ?? false,
      status: data.status || "published",
    }).returning();
    return formatBerita(inserted);
  }

  static async updateBerita(id, data) {
    const payload = {};
    if (data.judul !== undefined) payload.judul = data.judul;
    if (data.slug !== undefined) payload.slug = data.slug;
    if (data.kategori !== undefined) payload.kategori = data.kategori;
    if (data.tanggal !== undefined) payload.tanggal = data.tanggal;
    if (data.excerpt !== undefined) payload.excerpt = data.excerpt;
    if (data.konten !== undefined) payload.konten = data.konten;
    if (data.gambar !== undefined) payload.gambar = data.gambar;
    if (data.isUtama !== undefined) payload.is_utama = data.isUtama;
    if (data.status !== undefined) payload.status = data.status;
    payload.updated_at = new Date();

    const [updated] = await db.update(beritaItems).set(payload).where(eq(beritaItems.id, id)).returning();
    return updated ? formatBerita(updated) : null;
  }

  static async deleteBerita(id) {
    await db.delete(beritaItems).where(eq(beritaItems.id, id));
    return { success: true };
  }

  // --- Tentang Kami ---
  static async getTentang() {
    const rows = await db.select().from(tentangKami).where(eq(tentangKami.id, "main")).limit(1);
    return formatTentang(rows[0]);
  }

  static async updateTentang(data) {
    const payload = {
      visi: data.visi,
      misi: data.misi,
      deskripsi: data.deskripsi,
      deskripsi_paragraf_2: data.deskripsiParagraf2,
      poin_keunggulan: data.poinKeunggulan,
      updated_at: new Date(),
    };

    const existing = await db.select().from(tentangKami).where(eq(tentangKami.id, "main")).limit(1);
    if (existing.length === 0) {
      await db.insert(tentangKami).values({ id: "main", ...payload });
    } else {
      await db.update(tentangKami).set(payload).where(eq(tentangKami.id, "main"));
    }
    return this.getTentang();
  }

  // --- Testimoni ---
  static async getTestimoniList(includeInactive = false) {
    let query = db.select().from(testimoniItems);
    if (!includeInactive) {
      query = query.where(eq(testimoniItems.is_active, true));
    }
    const rows = await query.orderBy(desc(testimoniItems.created_at));
    return rows.map(formatTestimoni);
  }

  static async createTestimoni(data) {
    const [inserted] = await db.insert(testimoniItems).values({
      nama: data.nama,
      teks: data.teks,
      bintang: data.bintang ?? 5,
      jabatan: data.jabatan || "Anggota",
      foto: data.foto || "",
      is_active: data.isActive ?? true,
    }).returning();
    return formatTestimoni(inserted);
  }

  static async updateTestimoni(id, data) {
    const payload = {};
    if (data.nama !== undefined) payload.nama = data.nama;
    if (data.teks !== undefined) payload.teks = data.teks;
    if (data.bintang !== undefined) payload.bintang = data.bintang;
    if (data.jabatan !== undefined) payload.jabatan = data.jabatan;
    if (data.foto !== undefined) payload.foto = data.foto;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date();

    const [updated] = await db.update(testimoniItems).set(payload).where(eq(testimoniItems.id, id)).returning();
    return updated ? formatTestimoni(updated) : null;
  }

  static async deleteTestimoni(id) {
    await db.delete(testimoniItems).where(eq(testimoniItems.id, id));
    return { success: true };
  }
}
