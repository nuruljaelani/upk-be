import { z } from "zod";

// Validasi Form Pengecekan Data Anggota Lama (Step 1 Aktivasi)
export const cekDataAktivasiSchema = z.object({
  identifier: z
    .string()
    .min(3, "Nomor Anggota atau NIK wajib diisi"),
  no_hp: z
    .string()
    .min(8, "Nomor HP minimal 8 digit")
    .max(20, "Nomor HP maksimal 20 digit"),
  tgl_lahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir harus YYYY-MM-DD")
    .optional(),
});

export const verifyOTPSchema = z.object({
  identifier: z
    .string()
    .min(3, "Nomor Anggota atau NIK wajib diisi"),
  no_hp: z
    .string()
    .min(8, "Nomor HP minimal 8 digit")
    .max(20, "Nomor HP maksimal 20 digit"),
  otp: z
    .string()
    .length(6, "Kode OTP harus 6 digit")
    .regex(/^\d+$/, "Kode OTP hanya boleh berisi angka"),
});

// Validasi Form Eksekusi Aktivasi Akun (Step 2: Buat Password & Username)
export const aktivasiAkunSchema = z.object({
  identifier: z
    .string()
    .min(3, "Nomor Anggota atau NIK wajib diisi"),
  no_hp: z
    .string()
    .min(8, "Nomor HP minimal 8 digit"),
  tgl_lahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir harus YYYY-MM-DD")
    .optional(),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter"),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
});

// Validasi Login (Fleksibel: Username / No HP / No Anggota / Email)
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Username, No. Handphone, No. Anggota, atau Email wajib diisi"),
  password: z
    .string()
    .min(1, "Password wajib diisi"),
});

// Validasi Pendaftaran Calon Anggota Baru (Jika ada yang baru bergabung)
export const registerMemberSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  noHp: z
    .string()
    .min(8, "Nomor HP minimal 8 digit")
    .max(20, "Nomor HP maksimal 20 digit"),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter"),
  nik: z
    .string()
    .length(16, "NIK harus tepat 16 digit angka")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  namaLengkap: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  tempatLahir: z.string().optional(),
  tanggalLahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir harus YYYY-MM-DD")
    .optional(),
  jenisKelamin: z.enum(["L", "P"]).optional(),
  pekerjaan: z.string().optional(),
});
