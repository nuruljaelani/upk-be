import { db } from "./index.js";
import {
  siteSettings,
  heroContent,
  layananItems,
  beritaItems,
  tentangKami,
  testimoniItems,
} from "./schema/content.js";
import { eq } from "drizzle-orm";

async function run() {
  console.log("🌱 Menjalankan seeding data default Konten & CMS...");

  // 1. Site Settings
  const existingSettings = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "main"))
    .limit(1);

  if (existingSettings.length === 0) {
    await db.insert(siteSettings).values({
      id: "main",
      nama_organisasi: "UPK Mekarsari",
      tagline: "Wujudkan Impian bersama UPK Mekarsari",
      deskripsi_singkat: "Koperasi bersyariah yang siap membantu anda mencapai kesejahteraan finansial melalui layanan Pembiayaan dan Simpanan yang terjamin dan menguntungkan.",
      alamat: "Jl. Raya Mekarsari No. 123, Desa Mekarsari, Kec. Cileungsi, Kab. Bogor, Jawa Barat 16820",
      telepon: "(021) 823-4567",
      whatsapp: "+62 812-3456-7890",
      email: "info@upkmekarsari.com",
      email_cs: "cs@upkmekarsari.com",
      jam_operasional: "Senin - Jumat: 08:00 - 16:00 WIB",
      jam_sabtu: "Sabtu: 08:00 - 13:00 WIB",
      facebook: "https://facebook.com/upkmekarsari",
      instagram: "https://instagram.com/upkmekarsari",
      youtube: "",
      google_maps_url: "https://maps.google.com",
    });
    console.log("✅ Site Settings diinisialisasi.");
  }

  // 2. Hero Content
  const existingHero = await db
    .select()
    .from(heroContent)
    .where(eq(heroContent.id, "main"))
    .limit(1);

  if (existingHero.length === 0) {
    await db.insert(heroContent).values({
      id: "main",
      judul: "Wujudkan Impian bersama UPK Mekarsari",
      subjudul: "Koperasi bersyariah yang siap membantu anda mencapai kesejahteraan finansial melalui layanan Pembiayaan dan Simpanan yang terjamin dan menguntungkan.",
      label_tombol: "Aktivasi Akun",
      href_tombol: "/aktivasi",
      stat_anggota: "2000+",
      stat_tahun: "20+",
      stat_rating: "98%",
    });
    console.log("✅ Hero Content diinisialisasi.");
  }

  // 3. Layanan Items
  const existingLayanan = await db.select().from(layananItems);
  if (existingLayanan.length === 0) {
    await db.insert(layananItems).values([
      {
        judul: "Simpanan Pokok & Wajib",
        deskripsi: "Simpanan wajib bagi anggota dengan bagi hasil yang menguntungkan setiap bulannya",
        warna_border: "border-green-700",
        warna_ikon: "text-green-700",
        urutan: 1,
        is_active: true,
      },
      {
        judul: "Pinjaman Reguler",
        deskripsi: "Pinjaman reguler dengan persyaratan mudah dan pembayaran dengan suku bunga kompetitif",
        warna_border: "border-red-500",
        warna_ikon: "text-red-600",
        urutan: 2,
        is_active: true,
      },
      {
        judul: "Pembiayaan Usaha (UMKM)",
        deskripsi: "Dana pinjaman bagi pelaku usaha UMKM dengan bunga yang rendah dan proses mudah",
        warna_border: "border-green-500",
        warna_ikon: "text-green-600",
        urutan: 3,
        is_active: true,
      },
      {
        judul: "Simpanan Berjangka",
        deskripsi: "Simpanan berjangka dengan imbal hasil yang kompetitif dan perlindungan nilai dana anda",
        warna_border: "border-amber-500",
        warna_ikon: "text-amber-600",
        urutan: 4,
        is_active: true,
      },
    ]);
    console.log("✅ Layanan Items diinisialisasi.");
  }

  // 4. Berita Items
  const existingBerita = await db.select().from(beritaItems);
  if (existingBerita.length === 0) {
    await db.insert(beritaItems).values([
      {
        judul: "Rapat Anggota Tahunan (RAT) Tahun Buku 2025 Sukses Digelar",
        slug: "rat-tahun-buku-2025-sukses-digelar",
        kategori: "Pengumuman",
        tanggal: "2026-03-15",
        excerpt: "Koperasi UPK Mekarsari sukses menyelenggarakan Rapat Anggota Tahunan dengan agenda pembagian SHU dan pemaparan rencana kerja untuk tahun mendatang.",
        konten: "Koperasi Simpan Pinjam UPK Mekarsari dengan bangga melaporkan keberhasilan pelaksanaan Rapat Anggota Tahunan (RAT) Tahun Buku 2025. Acara yang dihadiri oleh seluruh pengurus, dewan pengawas, serta perwakilan anggota dari berbagai wilayah ini berlangsung khidmat dan penuh kebersamaan.\n\nDalam RAT kali ini, dilaporkan pertumbuhan aset koperasi sebesar 18.5% dibandingkan tahun sebelumnya, serta peningkatan alokasi Sisa Hasil Usaha (SHU) yang langsung didistribusikan ke rekening simpanan seluruh anggota aktif.",
        gambar: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
        is_utama: true,
        status: "published",
      },
      {
        judul: "Peluncuran Layanan Simulasi Pembiayaan Digital",
        slug: "peluncuran-layanan-simulasi-pembiayaan-digital",
        kategori: "Layanan",
        tanggal: "2026-03-10",
        excerpt: "Untuk memudahkan anggota dalam merencanakan keuangannya, kami meluncurkan fitur kalkulator simulasi pembiayaan dan simpanan langsung dari website kami.",
        konten: "Seiring dengan komitmen transformasi digital koperasi, kini seluruh anggota dapat melakukan estimasi angsuran pinjaman dan proyeksi bagi hasil simpanan secara transparan melalui portal website resmi.",
        gambar: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
        is_utama: false,
        status: "published",
      },
      {
        judul: "Kisah Sukses: Bantuan Modal untuk Warung Ibu Siti",
        slug: "kisah-sukses-bantuan-modal-warung-ibu-siti",
        kategori: "Kisah Sukses",
        tanggal: "2026-02-28",
        excerpt: "Melalui program Pembiayaan Usaha, Ibu Siti berhasil mengembangkan warungnya menjadi minimarket kecil yang melayani kebutuhan warga desa.",
        konten: "Berkat pembiayaan produktif dengan skema syariah yang mudah, Ibu Siti dari Cileungsi kini mampu melipatgandakan omzet hariannya dan membuka lapangan pekerjaan bagi tetangga sekitar.",
        gambar: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
        is_utama: false,
        status: "published",
      },
      {
        judul: "Beasiswa Pendidikan untuk Putra/Putri Anggota Berprestasi",
        slug: "beasiswa-pendidikan-putra-putri-anggota",
        kategori: "Sosial",
        tanggal: "2026-02-15",
        excerpt: "Sebagai bentuk tanggung jawab sosial, UPK Mekarsari membagikan beasiswa kepada 50 pelajar berprestasi dari keluarga anggota aktif.",
        konten: "Dana sosial koperasi tahun ini kembali disalurkan dalam bentuk bantuan pendidikan tingkat SD hingga Perguruan Tinggi bagi putra-putri anggota yang memiliki prestasi akademik membanggakan.",
        gambar: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
        is_utama: false,
        status: "published",
      },
    ]);
    console.log("✅ Berita Items diinisialisasi.");
  }

  // 5. Tentang Kami
  const existingTentang = await db
    .select()
    .from(tentangKami)
    .where(eq(tentangKami.id, "main"))
    .limit(1);

  if (existingTentang.length === 0) {
    await db.insert(tentangKami).values({
      id: "main",
      visi: "Menjadi koperasi terdepan dan terpercaya yang memberdayakan masyarakat dalam mencapai kesejahteraan finansial dan kemakmuran bersama.",
      misi: [
        "Memberikan layanan finansial yang mudah, cepat, dan terpercaya",
        "Meningkatkan kesejahteraan anggota melalui bagi hasil yang optimal",
        "Mengembangkan sistem yang transparan dan akuntabel",
        "Memberdayakan masyarakat melalui edukasi finansial",
      ],
      deskripsi: "UPK Mekarsari adalah koperasi yang telah berdiri sejak lebih dari 15 tahun lalu dengan komitmen untuk membantu anggota mencapai kesejahteraan finansial.",
      deskripsi_paragraf_2: "Dengan sistem yang transparan dan profesional, kami terus berkembang menjadi pilihan utama bagi ribuan anggota yang mempercayakan keuangan mereka kepada kami.",
      poin_keunggulan: [
        "Keamanan simpanan terjamin",
        "Bagi hasil kompetitif & transparan",
        "Proses pinjaman cepat tanpa ribet",
        "Didukung teknologi digital modern",
      ],
    });
    console.log("✅ Tentang Kami diinisialisasi.");
  }

  // 6. Testimoni Items
  const existingTestimoni = await db.select().from(testimoniItems);
  if (existingTestimoni.length === 0) {
    await db.insert(testimoniItems).values([
      {
        nama: "Bambang Soedirjo",
        teks: "Pelayanan sangat memuaskan, proses pengajuan pinjaman usaha cair dalam 2 hari dan syaratnya sangat mudah.",
        bintang: 5,
        jabatan: "Pengusaha Kuliner (Anggota sejak 2021)",
        is_active: true,
      },
      {
        nama: "Dewi Lestari",
        teks: "Simpanan berjangka di UPK Mekarsari sangat menguntungkan dengan bagi hasil yang jelas setiap bulannya.",
        bintang: 5,
        jabatan: "Guru & Anggota Aktif",
        is_active: true,
      },
      {
        nama: "Hadi Kusuma",
        teks: "Koperasi yang modern! Sekarang setor dan cek saldo simpanan bisa online dan kuitansinya langsung terbit resmi.",
        bintang: 5,
        jabatan: "Pedagang Pasar",
        is_active: true,
      },
    ]);
    console.log("✅ Testimoni Items diinisialisasi.");
  }

  console.log("🎉 Seeding konten CMS selesai dengan sukses!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Gagal seeding konten:", err);
  process.exit(1);
});
