import { Router } from "express";
import { PengaturanController } from "./pengaturan.controller.js";

const router = Router();

// All settings bundle
router.get("/", PengaturanController.getAll);
router.put("/", PengaturanController.updateAll);

// Sub-routes per tab
router.get("/profil", PengaturanController.getProfil);
router.put("/profil", PengaturanController.updateProfil);

router.get("/notifikasi", PengaturanController.getNotifikasi);
router.put("/notifikasi", PengaturanController.updateNotifikasi);

router.get("/keamanan", PengaturanController.getKeamanan);
router.put("/keamanan", PengaturanController.updateKeamanan);

router.get("/laporan", PengaturanController.getLaporan);
router.put("/laporan", PengaturanController.updateLaporan);

export default router;
