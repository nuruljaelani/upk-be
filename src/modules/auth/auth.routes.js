import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middlewares/validate.js";
import {
  cekDataAktivasiSchema,
  aktivasiAkunSchema,
  registerMemberSchema,
  loginSchema,
  verifyOTPSchema,
} from "./auth.validation.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

// 1. Alur Aktivasi Akun Anggota Lama (Tanpa Email, Berbasis No HP / No Anggota / NIK)
router.post(
  "/aktivasi/cek",
  validateRequest({ body: cekDataAktivasiSchema }),
  AuthController.cekAktivasi
);

// 2. Verifikasi OTP
router.post(
  "/aktivasi/verify-otp",
  validateRequest({ body: verifyOTPSchema }),
  AuthController.verifyOTP
);

// 3. Aktivasi Akun
router.post(
  "/aktivasi",
  validateRequest({ body: aktivasiAkunSchema }),
  AuthController.aktivasi
);

// 4. Alur Login (Mendukung Login via Username, No Handphone, No Anggota, atau Email)
router.post(
  "/login",
  validateRequest({ body: loginSchema }),
  AuthController.login
);

// 5. Alur Pendaftaran Calon Anggota Baru (Opsional)
router.post(
  "/register",
  validateRequest({ body: registerMemberSchema }),
  AuthController.register
);

// 6. Refresh Access Token
router.post("/refresh-token", AuthController.refreshAccessToken);

// 7. Logout
router.post("/logout", AuthController.logout);

// 8. Profil User Login
router.get("/me", authenticate, AuthController.getMe);

export default router;
