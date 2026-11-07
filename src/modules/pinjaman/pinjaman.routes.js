import { Router } from "express";
import { PinjamanController } from "./pinjaman.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validate.js";
import {
  createJenisPinjamanSchema,
  simulasiPinjamanSchema,
  ajukanPinjamanSchema,
  reviewPinjamanSchema,
  bayarAngsuranSchema,
} from "./pinjaman.validation.js";

const router = Router();

// 1. Simulasi Angsuran & Katalog Jenis Pinjaman (Dapat diakses publik atau member)
router.post(
  "/simulasi",
  validateRequest({ body: simulasiPinjamanSchema }),
  PinjamanController.simulasi
);
router.get("/jenis", PinjamanController.getJenisList);

// Semua rute di bawah memerlukan autentikasi login
router.use(authenticate);

// 2. Master Jenis Pinjaman (Create oleh staf/admin)
router.post(
  "/jenis",
  authorize("superadmin", "operator", "staf"),
  validateRequest({ body: createJenisPinjamanSchema }),
  PinjamanController.createJenis
);

// 3. Pengajuan & Portal Member
router.post(
  "/ajukan",
  authorize("member"),
  validateRequest({ body: ajukanPinjamanSchema }),
  PinjamanController.ajukan
);
router.get("/me", authorize("member"), PinjamanController.getMyPinjaman);

// 4. Daftar Seluruh Pengajuan Pinjaman (Back Office)
router.get(
  "/all",
  authorize("superadmin", "operator", "staf"),
  PinjamanController.getAllPengajuan
);
router.get(
  "/",
  authorize("superadmin", "operator", "staf"),
  PinjamanController.getAllPengajuan
);

// 5. Detail Pinjaman & Jadwal
router.get("/:id", PinjamanController.getDetail);

// 5. Review & Pencairan oleh Staf / BO
router.post(
  "/:id/review",
  authorize("superadmin", "operator", "staf"),
  validateRequest({ body: reviewPinjamanSchema }),
  PinjamanController.review
);

router.post(
  "/:id/cairkan",
  authorize("superadmin", "operator", "staf"),
  PinjamanController.cairkan
);

// 6. Pembayaran Angsuran
router.post(
  "/angsuran/bayar",
  authorize("superadmin", "operator", "staf"),
  validateRequest({ body: bayarAngsuranSchema }),
  PinjamanController.bayarAngsuran
);

export default router;
