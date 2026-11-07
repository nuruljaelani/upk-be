import { z } from "zod";

export const createJenisSimpananSchema = z.object({
  kode: z
    .string()
    .min(2, "Kode jenis simpanan minimal 2 karakter")
    .max(20, "Kode jenis simpanan maksimal 20 karakter")
    .transform((val) => val.toUpperCase()),
  nama: z.string().min(3, "Nama simpanan minimal 3 karakter"),
  tipe: z.enum(["pokok", "wajib", "sukarela", "berjangka"]),
  minimalSetoran: z.coerce
    .number()
    .min(0, "Minimal setoran tidak boleh negatif")
    .default(0),
  deskripsi: z.string().optional(),
  isWajib: z.boolean().default(false),
});

export const bukaRekeningSchema = z.object({
  memberId: z.string().uuid("ID Member tidak valid"),
  jenisSimpananId: z.string().uuid("ID Jenis Simpanan tidak valid"),
});

export const transaksiSimpananSchema = z
  .object({
    rekeningId: z.string().uuid("ID Rekening tidak valid").optional(),
    memberId: z.string().uuid("ID Member tidak valid").optional(),
    jenisSimpananId: z.string().uuid("ID Jenis Simpanan tidak valid").optional(),
    jenisMutasi: z.enum(["setor", "tarik"]),
    nominal: z.coerce
      .number()
      .min(1000, "Nominal transaksi minimal Rp 1.000")
      .optional(),
    jumlah: z.coerce
      .number()
      .min(1000, "Jumlah transaksi minimal Rp 1.000")
      .optional(),
    keterangan: z.string().optional(),
    metodePembayaran: z.enum(["tunai", "transfer"]).default("tunai"),
    buktiPembayaran: z.string().optional(),
  })
  .refine((data) => data.nominal !== undefined || data.jumlah !== undefined, {
    message: "Nominal transaksi wajib diisi minimal Rp 1.000",
    path: ["nominal"],
  })
  .refine(
    (data) =>
      data.rekeningId !== undefined ||
      (data.memberId !== undefined && data.jenisSimpananId !== undefined),
    {
      message: "Harus menyertakan ID Rekening atau ID Anggota beserta ID Jenis Simpanan",
      path: ["rekeningId"],
    }
  );

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const allTransaksiQuerySchema = z.object({
  search: z.string().optional(),
  jenisMutasi: z.enum(["setor", "tarik"]).optional(),
  tipe: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
