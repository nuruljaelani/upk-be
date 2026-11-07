import { Router } from "express";
import { ContentController } from "./content.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = Router();

// --- RUTE PUBLIK (Dapat diakses pengunjung tanpa login) ---
router.get("/public", ContentController.getPublicContent);
router.get("/settings", ContentController.getSettings);
router.get("/hero", ContentController.getHero);
router.get("/layanan", ContentController.getLayananList);
router.get("/berita", ContentController.getBeritaList);
router.get("/berita/:idOrSlug", ContentController.getBeritaDetail);
router.get("/tentang", ContentController.getTentang);
router.get("/testimoni", ContentController.getTestimoniList);

// --- RUTE BACK OFFICE (Memerlukan Login & Otorisasi Pengurus/Staf) ---
const boAuth = [authenticate, authorize("superadmin", "admin", "operator", "staf")];

// Pengaturan Situs
router.put("/settings", ...boAuth, ContentController.updateSettings);

// Hero Section
router.put("/hero", ...boAuth, ContentController.updateHero);

// Layanan
router.post("/layanan", ...boAuth, ContentController.createLayanan);
router.put("/layanan/:id", ...boAuth, ContentController.updateLayanan);
router.delete("/layanan/:id", ...boAuth, ContentController.deleteLayanan);

// Berita & Pengumuman
router.post("/berita", ...boAuth, ContentController.createBerita);
router.put("/berita/:id", ...boAuth, ContentController.updateBerita);
router.delete("/berita/:id", ...boAuth, ContentController.deleteBerita);

// Tentang Kami
router.put("/tentang", ...boAuth, ContentController.updateTentang);

// Testimoni
router.post("/testimoni", ...boAuth, ContentController.createTestimoni);
router.put("/testimoni/:id", ...boAuth, ContentController.updateTestimoni);
router.delete("/testimoni/:id", ...boAuth, ContentController.deleteTestimoni);

export default router;
