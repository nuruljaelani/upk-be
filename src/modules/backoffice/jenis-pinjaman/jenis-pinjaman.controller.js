import { JenisPinjamanService } from "./jenis-pinjaman.service.js";
import { ApiResponse } from "../../../utils/response.js";

export class JenisPinjamanController {
  // GET /api/bo/jenis-pinjaman
  static async getAll(req, res, next) {
    try {
      const result = await JenisPinjamanService.getAll(req.query);
      if (result.pagination) {
        return ApiResponse.paginated(
          res,
          result.items,
          result.pagination,
          "Daftar jenis pinjaman berhasil diambil"
        );
      }
      return ApiResponse.success(res, result.items, "Daftar jenis pinjaman berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bo/jenis-pinjaman/:id
  static async getById(req, res, next) {
    try {
      const item = await JenisPinjamanService.getById(req.params.id);
      return ApiResponse.success(res, item, "Detail jenis pinjaman berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/bo/jenis-pinjaman
  static async create(req, res, next) {
    try {
      const created = await JenisPinjamanService.create(req.body);
      return ApiResponse.success(res, created, "Jenis pinjaman baru berhasil dibuat");
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bo/jenis-pinjaman/:id
  static async update(req, res, next) {
    try {
      const updated = await JenisPinjamanService.update(req.params.id, req.body);
      return ApiResponse.success(res, updated, "Jenis pinjaman berhasil diperbarui");
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/bo/jenis-pinjaman/:id
  static async delete(req, res, next) {
    try {
      const result = await JenisPinjamanService.delete(req.params.id);
      return ApiResponse.success(res, result.data || null, result.message);
    } catch (error) {
      next(error);
    }
  }
}
