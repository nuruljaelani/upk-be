import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import dashboardRoutes from "./dashboard/dashboard.routes.js";
import anggotaRoutes from "./anggota/anggota.routes.js";
import jenisPinjamanRoutes from "./jenis-pinjaman/jenis-pinjaman.routes.js";
import laporanRoutes from "./laporan/laporan.routes.js";
import pengaturanRoutes from "./pengaturan/pengaturan.routes.js";

const router = Router();

// Seluruh rute Back Office memerlukan hak akses staf, operator, admin, atau superadmin
router.use(authenticate, authorize("superadmin", "admin", "operator", "staf"));

// Sub-modul terpisah
router.use("/dashboard", dashboardRoutes);
router.use("/anggota", anggotaRoutes);
router.use("/jenis-pinjaman", jenisPinjamanRoutes);
router.use("/laporan", laporanRoutes);
router.use("/pengaturan", pengaturanRoutes);

export default router;

