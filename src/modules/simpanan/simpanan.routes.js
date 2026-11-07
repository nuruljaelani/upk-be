import { Router } from "express";
import { SimpananController } from "./simpanan.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validate.js";
import {
  createJenisSimpananSchema,
  bukaRekeningSchema,
  transaksiSimpananSchema,
  paginationQuerySchema,
  allTransaksiQuerySchema,
} from "./simpanan.validation.js";

const router = Router();

// Semua rute simpanan memerlukan autentikasi login
router.use(authenticate);

// 1. Master Jenis Simpanan
router.get("/jenis", SimpananController.getJenisList);
router.post(
  "/jenis",
  authorize("superadmin", "admin", "operator", "staf"),
  validateRequest({ body: createJenisSimpananSchema }),
  SimpananController.createJenis
);

// 2. Rekening Simpanan
router.post(
  "/rekening/buka",
  authorize("superadmin", "admin", "operator", "staf"),
  validateRequest({ body: bukaRekeningSchema }),
  SimpananController.bukaRekening
);

router.get("/rekening/me", SimpananController.getMyRekening);

// Khusus Kasir / Back Office: Ambil ringkasan seluruh rekening & saldo anggota tertentu
router.get(
  "/member/:memberId/rekening",
  authorize("superadmin", "admin", "operator", "staf"),
  SimpananController.getRekeningByMemberForCashier
);

router.get("/rekening/:id", SimpananController.getRekeningDetail);
router.get(
  "/rekening/:id/mutasi",
  validateRequest({ query: paginationQuerySchema }),
  SimpananController.getMutasi
);

// 3. Transaksi Setor / Tarik (Kasir BO)
router.post(
  "/transaksi",
  authorize("superadmin", "admin", "operator", "staf"),
  validateRequest({ body: transaksiSimpananSchema }),
  SimpananController.transaksi
);

// 4. Riwayat Seluruh Transaksi Simpanan (Back Office)
router.get(
  "/all-transaksi",
  authorize("superadmin", "admin", "operator", "staf"),
  validateRequest({ query: allTransaksiQuerySchema }),
  SimpananController.getAllTransaksi
);

export default router;
