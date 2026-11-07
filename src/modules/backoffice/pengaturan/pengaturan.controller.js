import { PengaturanService } from "./pengaturan.service.js";

export class PengaturanController {
  // All-in-one get & update
  static async getAll(req, res, next) {
    try {
      const data = await PengaturanService.getAll();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateAll(req, res, next) {
    try {
      const data = await PengaturanService.updateAll(req.body);
      return res.status(200).json({
        status: "success",
        message: "Seluruh pengaturan sistem berhasil diperbarui",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Profil Koperasi
  static async getProfil(req, res, next) {
    try {
      const data = await PengaturanService.getProfil();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfil(req, res, next) {
    try {
      const data = await PengaturanService.updateProfil(req.body);
      return res.status(200).json({
        status: "success",
        message: "Profil koperasi berhasil disimpan",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Notifikasi
  static async getNotifikasi(req, res, next) {
    try {
      const data = await PengaturanService.getNotifikasi();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateNotifikasi(req, res, next) {
    try {
      const data = await PengaturanService.updateNotifikasi(req.body);
      return res.status(200).json({
        status: "success",
        message: "Pengaturan notifikasi berhasil disimpan",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Keamanan
  static async getKeamanan(req, res, next) {
    try {
      const data = await PengaturanService.getKeamanan();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateKeamanan(req, res, next) {
    try {
      const data = await PengaturanService.updateKeamanan(req.body);
      return res.status(200).json({
        status: "success",
        message: "Pengaturan keamanan berhasil disimpan",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Laporan & Backup
  static async getLaporan(req, res, next) {
    try {
      const data = await PengaturanService.getLaporan();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateLaporan(req, res, next) {
    try {
      const data = await PengaturanService.updateLaporan(req.body);
      return res.status(200).json({
        status: "success",
        message: "Pengaturan laporan & backup berhasil disimpan",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}
