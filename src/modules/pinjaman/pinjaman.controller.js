import { PinjamanService } from "./pinjaman.service.js";
import { ApiResponse } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

export class PinjamanController {
  // GET /api/v1/pinjaman/jenis
  static async getJenisList(_req, res, next) {
    try {
      const list = await PinjamanService.getJenisPinjamanList();
      return ApiResponse.success(res, list, "Daftar jenis pinjaman berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/pinjaman/jenis (BO / Staff / Admin)
  static async createJenis(req, res, next) {
    try {
      const created = await PinjamanService.createJenisPinjaman(req.body);
      return ApiResponse.success(res, created, "Jenis pinjaman berhasil ditambahkan", 201);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/pinjaman/simulasi (Public / Kalkulator)
  static simulasi(req, res, next) {
    try {
      const hasil = PinjamanService.simulasi(req.body);
      return ApiResponse.success(res, hasil, "Simulasi angsuran pinjaman berhasil dihitung");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/pinjaman/ajukan (Member)
  static async ajukan(req, res, next) {
    try {
      if (!req.user.memberId) {
        throw ApiError.notFound("Akun Anda tidak terdaftar sebagai profil anggota koperasi");
      }
      const result = await PinjamanService.ajukanPinjaman(req.body, req.user.memberId);
      return ApiResponse.success(res, result, "Pengajuan pinjaman berhasil diajukan", 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/pinjaman/me (Member portal)
  static async getMyPinjaman(req, res, next) {
    try {
      if (!req.user.memberId) {
        throw ApiError.notFound("Akun Anda tidak terhubung dengan profil anggota");
      }
      const list = await PinjamanService.getPinjamanByMember(req.user.memberId);
      return ApiResponse.success(res, list, "Daftar pinjaman Anda berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/pinjaman/:id
  static async getDetail(req, res, next) {
    try {
      const detail = await PinjamanService.getPinjamanDetail(req.params.id);

      // Keamanan akses: Member hanya boleh melihat pinjamannya sendiri
      if (req.user.role === "member" && detail.memberId !== req.user.memberId) {
        throw ApiError.forbidden("Anda tidak memiliki izin melihat data pinjaman ini");
      }

      return ApiResponse.success(res, detail, "Detail pinjaman berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/pinjaman/:id/review (Staf / Operator / Superadmin)
  static async review(req, res, next) {
    try {
      const reviewerId = req.user.userId;
      const result = await PinjamanService.reviewPinjaman(req.params.id, req.body, reviewerId);
      return ApiResponse.success(res, result, `Pinjaman berhasil di-${req.body.status}`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/pinjaman/:id/cairkan (Staf / Operator / Superadmin)
  static async cairkan(req, res, next) {
    try {
      const result = await PinjamanService.cairkanPinjaman(req.params.id);
      return ApiResponse.success(res, result, "Pinjaman berhasil dicairkan");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/pinjaman/angsuran/bayar (Staf / Operator / Superadmin)
  static async bayarAngsuran(req, res, next) {
    try {
      const operatorId = req.user.userId;
      const result = await PinjamanService.bayarAngsuran(req.body, operatorId);
      return ApiResponse.success(res, result, "Pembayaran angsuran berhasil dicatat");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/pinjaman atau /api/v1/pinjaman/all (Staf / Operator / Superadmin)
  static async getAllPengajuan(req, res, next) {
    try {
      const result = await PinjamanService.getAllPengajuan(req.query);
      return ApiResponse.paginated(
        res,
        result.items,
        result.pagination,
        "Daftar pengajuan pinjaman berhasil diambil"
      );
    } catch (error) {
      next(error);
    }
  }
}
