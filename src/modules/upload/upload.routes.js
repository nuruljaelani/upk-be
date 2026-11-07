import { Router } from "express";
import multer from "multer";
import { UploadController } from "./upload.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

// Konfigurasi Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimal 10MB
  },
  fileFilter: (_req, file, cb) => {
    // Validasi mime-type umum (gambar dan pdf)
    const allowedMime = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          "Format file tidak didukung. Harap unggah file gambar (JPG, PNG, WebP) atau PDF.",
          400
        )
      );
    }
  },
});

// Seluruh route upload memerlukan login
router.use(authenticate);

// 1. Upload Avatar Member
router.post(
  "/avatar",
  upload.single("file"),
  UploadController.uploadAvatar
);

// 2. Upload Dokumen Umum (KTP, Dokumen Pendukung Pinjaman, dsb)
router.post(
  "/file",
  upload.single("file"),
  UploadController.uploadFile
);

// 3. Hapus Dokumen dari Cloudinary
router.delete(
  "/",
  UploadController.deleteFile
);

export default router;
