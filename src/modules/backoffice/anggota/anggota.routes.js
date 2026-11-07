import { Router } from "express";
import { AnggotaController } from "./anggota.controller.js";
import { validateRequest } from "../../../middlewares/validate.js";
import {
  anggotaListQuerySchema,
  updateAnggotaStatusSchema,
  createAnggotaSchema,
  updateAnggotaSchema,
} from "./anggota.validation.js";

const router = Router();

// 1. Get List Anggota dengan Search & Filter Pagination
router.get(
  "/",
  validateRequest({ query: anggotaListQuerySchema }),
  AnggotaController.getAnggota
);

// 2. Get Detail Anggota
router.get("/:id", AnggotaController.getAnggotaDetail);

// 3. Tambah Anggota Baru Manual
router.post(
  "/",
  validateRequest({ body: createAnggotaSchema }),
  AnggotaController.createAnggota
);

// 4. Update Data Anggota
router.put(
  "/:id",
  validateRequest({ body: updateAnggotaSchema }),
  AnggotaController.updateAnggota
);

// 5. Update Status Keanggotaan
router.patch(
  "/:id/status",
  validateRequest({ body: updateAnggotaStatusSchema }),
  AnggotaController.updateStatusAnggota
);

// 6. Hapus / Deaktifkan Anggota
router.delete("/:id", AnggotaController.deleteAnggota);

export default router;
