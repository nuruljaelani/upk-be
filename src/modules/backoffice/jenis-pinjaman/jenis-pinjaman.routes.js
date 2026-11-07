import { Router } from "express";
import { JenisPinjamanController } from "./jenis-pinjaman.controller.js";
import { validateRequest } from "../../../middlewares/validate.js";
import {
  queryJenisPinjamanSchema,
  createJenisPinjamanSchema,
  updateJenisPinjamanSchema,
} from "./jenis-pinjaman.validation.js";

const router = Router();

// 1. List All Jenis Pinjaman
router.get(
  "/",
  validateRequest({ query: queryJenisPinjamanSchema }),
  JenisPinjamanController.getAll
);

// 2. Get Detail Jenis Pinjaman
router.get("/:id", JenisPinjamanController.getById);

// 3. Tambah Jenis Pinjaman Baru
router.post(
  "/",
  validateRequest({ body: createJenisPinjamanSchema }),
  JenisPinjamanController.create
);

// 4. Update Jenis Pinjaman
router.put(
  "/:id",
  validateRequest({ body: updateJenisPinjamanSchema }),
  JenisPinjamanController.update
);

// 5. Hapus / Deaktifkan Jenis Pinjaman
router.delete("/:id", JenisPinjamanController.delete);

export default router;
