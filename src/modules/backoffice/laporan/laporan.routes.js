import { Router } from "express";
import { LaporanController } from "./laporan.controller.js";
import { validateRequest } from "../../../middlewares/validate.js";
import { laporanFilterSchema } from "./laporan.validation.js";

const router = Router();

// 1. Laporan Simpanan
router.get(
  "/simpanan",
  validateRequest({ query: laporanFilterSchema }),
  LaporanController.getLaporanSimpanan
);

// 2. Laporan Pinjaman
router.get(
  "/pinjaman",
  validateRequest({ query: laporanFilterSchema }),
  LaporanController.getLaporanPinjaman
);

// 3. Laporan Arus Kas
router.get(
  "/arus-kas",
  validateRequest({ query: laporanFilterSchema }),
  LaporanController.getLaporanArusKas
);

// 4. Laporan Kolektibilitas & Aging NPL
router.get("/kolektibilitas", LaporanController.getLaporanKolektibilitas);

// 5. Laporan Rekapitulasi Per Sentra
router.get("/rekap-sentra", LaporanController.getLaporanRekapSentra);

// 6. Laporan Kalkulasi SHU
router.get("/shu", LaporanController.getLaporanSHU);

export default router;
