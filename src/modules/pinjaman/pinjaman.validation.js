import { z } from "zod";

export const createJenisPinjamanSchema = z.object({
  kode: z
    .string()
    .min(2, "Kode jenis pinjaman minimal 2 karakter")
    .max(20, "Kode jenis pinjaman maksimal 20 karakter")
    .transform((val) => val.toUpperCase()),
  nama: z.string().min(3, "Nama pinjaman minimal 3 karakter"),
  metodeBunga: z.enum(["flat", "menurun", "anuitas"]).default("flat"),
  sukuBungaTahunan: z.coerce
    .number()
    .min(0, "Suku bunga tidak boleh negatif")
    .max(100, "Suku bunga maksimal 100% per tahun"),
  tenorMinBulan: z.coerce.number().min(1).default(1),
  tenorMaxBulan: z.coerce.number().min(1).max(120).default(60),
  plafonMin: z.coerce.number().min(100000).default(500000),
  plafonMax: z.coerce.number().min(100000).default(100000000),
  biayaAdminPersen: z.coerce.number().min(0).max(20).default(1),
  deskripsi: z.string().optional(),
});

export const simulasiPinjamanSchema = z.object({
  jumlahPinjaman: z.coerce
    .number()
    .min(100000, "Jumlah pinjaman minimal Rp 100.000"),
  tenorBulan: z.coerce
    .number()
    .min(1, "Tenor minimal 1 bulan")
    .max(120, "Tenor maksimal 120 bulan"),
  sukuBungaTahunan: z.coerce
    .number()
    .min(0, "Suku bunga minimal 0%")
    .max(100, "Suku bunga maksimal 100%"),
  metodeBunga: z.enum(["flat", "menurun", "anuitas"]).default("flat"),
});

export const ajukanPinjamanSchema = z.object({
  jenisPinjamanId: z.string().uuid("ID Jenis Pinjaman tidak valid"),
  jumlahPinjaman: z.coerce
    .number()
    .min(100000, "Jumlah pinjaman minimal Rp 100.000"),
  tenorBulan: z.coerce
    .number()
    .min(1, "Tenor minimal 1 bulan")
    .max(120, "Tenor maksimal 120 bulan"),
  tujuanPinjaman: z.string().min(5, "Tujuan pinjaman minimal 5 karakter"),
  dokumenPendukung: z.any().optional(),
  dokumen_pendukung: z.any().optional(),
  dokumenPersyaratan: z.any().optional(),
});

export const reviewPinjamanSchema = z.object({
  status: z.enum(["disetujui", "ditolak"]),
  catatanReview: z.string().optional(),
});

export const bayarAngsuranSchema = z.object({
  jadwalAngsuranId: z.string().uuid("ID Jadwal Angsuran tidak valid"),
  nominalBayar: z.coerce
    .number()
    .min(1000, "Nominal pembayaran minimal Rp 1.000"),
  metodePembayaran: z.string().default("tunai"),
  buktiPembayaran: z.string().optional(),
  catatan: z.string().optional(),
});
