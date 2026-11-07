import { z } from "zod";

export const anggotaListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["pending", "active", "inactive", "suspended"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const updateAnggotaStatusSchema = z.object({
  status: z.enum(["pending", "active", "inactive", "suspended"]),
});

export const createAnggotaSchema = z.object({
  no_anggota: z.string().min(3).max(30).optional().nullable(),
  noAnggota: z.string().min(3).max(30).optional().nullable(),
  nomorAnggota: z.string().min(3).max(30).optional().nullable(),
  nik: z.string().length(16, "NIK harus tepat 16 digit"),
  nama_lengkap: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
  namaLengkap: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
  nama: z.string().min(2, "Nama lengkap minimal 2 karakter").optional(),
  no_hp: z.string().min(10, "Nomor HP minimal 10 digit").optional(),
  noHp: z.string().min(10, "Nomor HP minimal 10 digit").optional(),
  nomorHp: z.string().min(10, "Nomor HP minimal 10 digit").optional(),
  jenis_kelamin: z.string().optional(),
  jenisKelamin: z.string().optional(),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  tempat_lahir: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  pekerjaan: z.string().optional().nullable(),
  status_keanggotaan: z.string().optional().default("active"),
  statusKeanggotaan: z.string().optional(),
  status: z.string().optional(),
});

export const updateAnggotaSchema = z.object({
  nama_lengkap: z.string().min(2).optional(),
  namaLengkap: z.string().min(2).optional(),
  nama: z.string().min(2).optional(),
  nik: z.string().length(16).optional(),
  no_hp: z.string().min(10).optional(),
  noHp: z.string().min(10).optional(),
  nomorHp: z.string().min(10).optional(),
  jenis_kelamin: z.string().optional(),
  jenisKelamin: z.string().optional(),
  alamat: z.string().min(5).optional(),
  tempat_lahir: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  pekerjaan: z.string().optional().nullable(),
  status_keanggotaan: z.string().optional(),
  statusKeanggotaan: z.string().optional(),
  status: z.string().optional(),
});
