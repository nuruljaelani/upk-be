import { SimpananService } from "./simpanan.service.js";
import { ApiResponse } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

export class SimpananController {
  // GET /api/v1/simpanan/jenis
  static async getJenisList(_req, res, next) {
    try {
      const list = await SimpananService.getJenisSimpananList();
      return ApiResponse.success(res, list, "Daftar jenis simpanan berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/simpanan/jenis (BO / Staff / Admin)
  static async createJenis(req, res, next) {
    try {
      const created = await SimpananService.createJenisSimpanan(req.body);
      return ApiResponse.success(res, created, "Jenis simpanan berhasil ditambahkan", 201);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/simpanan/rekening/buka
  static async bukaRekening(req, res, next) {
    try {
      const result = await SimpananService.bukaRekening(req.body);
      return ApiResponse.success(res, result, "Rekening simpanan berhasil dibuka", 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/simpanan/rekening/me (Member portal)
  static async getMyRekening(req, res, next) {
    try {
      if (!req.user.memberId) {
        throw ApiError.notFound("Akun ini tidak terhubung dengan profil anggota");
      }
      const list = await SimpananService.getRekeningByMember(req.user.memberId);
      return ApiResponse.success(res, list, "Daftar rekening simpanan Anda berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/simpanan/rekening/:id
  static async getRekeningDetail(req, res, next) {
    try {
      const detail = await SimpananService.getRekeningDetail(req.params.id);

      // Keamanan: Jika yang mengakses adalah member, pastikan hanya rekening miliknya
      if (req.user.role === "member" && detail.memberId !== req.user.memberId) {
        throw ApiError.forbidden("Anda tidak memiliki akses ke rekening ini");
      }

      return ApiResponse.success(res, detail, "Detail rekening simpanan berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/simpanan/rekening/:id/mutasi
  static async getMutasi(req, res, next) {
    try {
      // Keamanan kepemilikan rekening jika role adalah member
      if (req.user.role === "member") {
        const detail = await SimpananService.getRekeningDetail(req.params.id);
        if (detail.memberId !== req.user.memberId) {
          throw ApiError.forbidden("Anda tidak memiliki akses ke riwayat mutasi rekening ini");
        }
      }

      const { items, pagination } = await SimpananService.getMutasiByRekening(
        req.params.id,
        req.query
      );
      return ApiResponse.paginated(
        res,
        items,
        pagination,
        "Riwayat mutasi simpanan berhasil diambil"
      );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/simpanan/transaksi (Setor / Tarik oleh BO / Staf / Operator)
  static async transaksi(req, res, next) {
    try {
      const operatorId = req.user.userId;
      const result = await SimpananService.transaksiSetorTarik(req.body, operatorId);
      return ApiResponse.success(
        res,
        result,
        `Transaksi ${req.body.jenisMutasi} simpanan berhasil diproses`
      );
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/simpanan/member/:memberId/rekening (Kasir BO: ambil rekening & saldo anggota)
  static async getRekeningByMemberForCashier(req, res, next) {
    try {
      const result = await SimpananService.getRekeningByMemberForCashier(req.params.memberId);
      return ApiResponse.success(
        res,
        result,
        "Ringkasan rekening anggota untuk kasir berhasil diambil"
      );
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/simpanan/all-transaksi (Kasir & BO: riwayat mutasi transaksi seluruh anggota)
  static async getAllTransaksi(req, res, next) {
    try {
      const result = await SimpananService.getAllTransaksi(req.query);
      return res.status(200).json({
        status: "success",
        message: "Daftar seluruh transaksi simpanan berhasil diambil",
        data: {
          items: result.items,
          ringkasan: result.ringkasan,
          pagination: result.pagination,
        },
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}
