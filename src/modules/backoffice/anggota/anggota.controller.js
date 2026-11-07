import { AnggotaService } from "./anggota.service.js";
import { ApiResponse } from "../../../utils/response.js";

export class AnggotaController {
  // GET /api/bo/anggota
  static async getAnggota(req, res, next) {
    try {
      const { items, pagination } = await AnggotaService.getAnggotaList(req.query);
      return ApiResponse.paginated(
        res,
        items,
        pagination,
        "Daftar anggota koperasi berhasil diambil"
      );
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bo/anggota/:id
  static async getAnggotaDetail(req, res, next) {
    try {
      const data = await AnggotaService.getAnggotaById(req.params.id);
      return ApiResponse.success(res, data, "Detail anggota berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/bo/anggota
  static async createAnggota(req, res, next) {
    try {
      const created = await AnggotaService.createAnggota(req.body);
      return ApiResponse.created(res, created, "Anggota baru berhasil didaftarkan");
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/bo/anggota/:id
  static async updateAnggota(req, res, next) {
    try {
      const updated = await AnggotaService.updateAnggota(req.params.id, req.body);
      return ApiResponse.success(res, updated, "Data anggota berhasil diperbarui");
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/bo/anggota/:id/status
  static async updateStatusAnggota(req, res, next) {
    try {
      const updated = await AnggotaService.updateAnggotaStatus(
        req.params.id,
        req.body.status
      );
      return ApiResponse.success(
        res,
        updated,
        `Status anggota berhasil diubah menjadi ${req.body.status}`
      );
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/bo/anggota/:id
  static async deleteAnggota(req, res, next) {
    try {
      const result = await AnggotaService.deleteAnggota(req.params.id);
      return ApiResponse.success(res, result.data || null, result.message);
    } catch (error) {
      next(error);
    }
  }
}
