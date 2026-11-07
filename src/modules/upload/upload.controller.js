import { UploadService } from "./upload.service.js";
import { ApiResponse } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

export class UploadController {
  /**
   * Upload Avatar Foto Profil Anggota
   * POST /api/upload/avatar
   */
  static async uploadAvatar(req, res, next) {
    try {
      const buffer = req.file?.buffer;
      const base64 = req.body?.image || req.body?.avatar || req.body?.file;

      if (!buffer && !base64) {
        throw ApiError.badRequest("Silakan pilih file gambar atau unggah foto");
      }

      // Member ID: diambil dari user login (member) atau dikirim admin (jika operator mengupload foto anggota)
      const memberId = req.body?.memberId || req.user?.memberId;

      const result = await UploadService.uploadAvatar(memberId, { buffer, base64 });

      return ApiResponse.success(res, result, "Foto profil berhasil diunggah ke Cloudinary");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload Dokumen / Berkas Umum (KTP, Dokumen Pinjaman, Bukti Pembayaran)
   * POST /api/upload/file
   */
  static async uploadFile(req, res, next) {
    try {
      const buffer = req.file?.buffer;
      const base64 = req.body?.file || req.body?.data;
      const folder = req.body?.folder || "koperasi/dokumen";

      if (!buffer && !base64) {
        throw ApiError.badRequest("File tidak ditemukan dalam request");
      }

      const result = await UploadService.uploadDokumen({ buffer, base64, folder });

      return ApiResponse.success(res, result, "Berkas berhasil diunggah ke Cloudinary");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hapus File dari Cloudinary
   * DELETE /api/upload
   */
  static async deleteFile(req, res, next) {
    try {
      const { publicId } = req.body;
      if (!publicId) {
        throw ApiError.badRequest("publicId wajib disertakan");
      }

      const result = await UploadService.deleteAsset(publicId);
      return ApiResponse.success(res, result, "Berkas berhasil dihapus dari Cloudinary");
    } catch (error) {
      next(error);
    }
  }
}
