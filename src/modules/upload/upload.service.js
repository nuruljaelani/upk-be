import { cloudinary } from "../../config/cloudinary.js";
import { db } from "../../db/index.js";
import { members } from "../../db/schema/members.js";
import { eq } from "drizzle-orm";
import { ApiError } from "../../utils/errors.js";

export class UploadService {
  /**
   * Cek apakah kredensial Cloudinary sudah diset di environment
   */
  static isConfigured() {
    const config = cloudinary.config();
    return Boolean(config.cloud_name && config.api_key && config.api_secret);
  }

  /**
   * Upload file dari Buffer (Multer memoryStorage) ke Cloudinary
   */
  static async uploadBuffer(buffer, options = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || "koperasi/dokumen",
          resource_type: options.resourceType || "auto",
          transformation: options.transformation,
        },
        (error, result) => {
          if (error) return reject(new ApiError(error.message || "Gagal mengunggah ke Cloudinary", 500));
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload file dari Base64 Data URI ke Cloudinary
   */
  static async uploadBase64(base64Data, options = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: options.folder || "koperasi/dokumen",
        resource_type: options.resourceType || "auto",
        transformation: options.transformation,
      });
      return result;
    } catch (error) {
      throw new ApiError(error.message || "Gagal mengunggah file Base64 ke Cloudinary", 500);
    }
  }

  /**
   * Upload Avatar Anggota dan simpan URL ke database
   */
  static async uploadAvatar(memberId, { buffer, base64 }) {
    let finalUrl = null;
    let publicId = null;
    let isCloudinary = false;

    const transformation = [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ];

    if (this.isConfigured()) {
      let result;
      if (buffer) {
        result = await this.uploadBuffer(buffer, {
          folder: "koperasi/avatars",
          transformation,
        });
      } else if (base64) {
        result = await this.uploadBase64(base64, {
          folder: "koperasi/avatars",
          transformation,
        });
      }

      if (result) {
        finalUrl = result.secure_url || result.url;
        publicId = result.public_id;
        isCloudinary = true;
      }
    }

    // Jika Cloudinary belum dikonfigurasi, gunakan base64 sebagai fallback agar tidak memblokir aplikasi
    if (!finalUrl) {
      if (base64) {
        finalUrl = base64;
      } else if (buffer) {
        finalUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      } else {
        throw ApiError.badRequest("File atau data gambar tidak ditemukan");
      }
    }

    // Simpan ke database jika memberId diberikan
    if (memberId) {
      await db
        .update(members)
        .set({ foto_profil: finalUrl })
        .where(eq(members.id, memberId));
    }

    return {
      url: finalUrl,
      publicId,
      isCloudinary,
      message: isCloudinary
        ? "Foto profil berhasil diunggah ke Cloudinary"
        : "Foto profil berhasil disimpan (Fallback Lokal). Silakan isi kredensial Cloudinary di .env untuk upload cloud otomatis.",
    };
  }

  /**
   * Upload Dokumen Pinjaman (KTP, Slip Gaji, Agunan, dsb)
   */
  static async uploadDokumen({ buffer, base64, folder = "koperasi/dokumen" }) {
    let finalUrl = null;
    let publicId = null;
    let isCloudinary = false;

    if (this.isConfigured()) {
      let result;
      if (buffer) {
        result = await this.uploadBuffer(buffer, { folder });
      } else if (base64) {
        result = await this.uploadBase64(base64, { folder });
      }

      if (result) {
        finalUrl = result.secure_url || result.url;
        publicId = result.public_id;
        isCloudinary = true;
      }
    }

    if (!finalUrl) {
      if (base64) {
        finalUrl = base64;
      } else if (buffer) {
        finalUrl = `data:application/octet-stream;base64,${buffer.toString("base64")}`;
      } else {
        throw ApiError.badRequest("File dokumen tidak ditemukan");
      }
    }

    return {
      url: finalUrl,
      publicId,
      isCloudinary,
      message: isCloudinary
        ? "Berkas berhasil diunggah ke Cloudinary"
        : "Berkas berhasil disimpan. Isi kredensial Cloudinary di .env untuk upload cloud otomatis.",
    };
  }

  /**
   * Hapus file dari Cloudinary berdasarkan publicId
   */
  static async deleteAsset(publicId) {
    if (!this.isConfigured()) {
      return { result: "ok", message: "Cloudinary tidak aktif" };
    }

    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new ApiError(error.message || "Gagal menghapus file dari Cloudinary", 500);
    }
  }
}
