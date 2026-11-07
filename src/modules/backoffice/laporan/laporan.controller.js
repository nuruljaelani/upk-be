import { LaporanService } from "./laporan.service.js";
import { ApiResponse } from "../../../utils/response.js";

export class LaporanController {
  // GET /api/bo/laporan/simpanan
  static async getLaporanSimpanan(req, res, next) {
    try {
      const report = await LaporanService.getLaporanSimpanan(req.query);
      return ApiResponse.success(res, report, "Laporan simpanan berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bo/laporan/pinjaman
  static async getLaporanPinjaman(req, res, next) {
    try {
      const report = await LaporanService.getLaporanPinjaman(req.query);
      return ApiResponse.success(res, report, "Laporan pinjaman berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bo/laporan/arus-kas
  static async getLaporanArusKas(req, res, next) {
    try {
      const report = await LaporanService.getLaporanArusKas(req.query);
      return ApiResponse.success(res, report, "Laporan arus kas berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bo/laporan/kolektibilitas
  static async getLaporanKolektibilitas(req, res, next) {
    try {
      const report = await LaporanService.getLaporanKolektibilitas();
      return ApiResponse.success(res, report, "Laporan kolektibilitas dan NPL pinjaman berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bo/laporan/rekap-sentra
  static async getLaporanRekapSentra(req, res, next) {
    try {
      const report = await LaporanService.getLaporanRekapSentra();
      return ApiResponse.success(res, report, "Laporan rekapitulasi per sentra berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bo/laporan/shu
  static async getLaporanSHU(req, res, next) {
    try {
      const report = await LaporanService.getLaporanSHU(req.query);
      return ApiResponse.success(res, report, "Laporan kalkulasi SHU berhasil diambil");
    } catch (error) {
      next(error);
    }
  }
}
