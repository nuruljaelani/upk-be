import { ContentService } from "./content.service.js";

export class ContentController {
  // Public all-in-one
  static async getPublicContent(req, res, next) {
    try {
      const data = await ContentService.getPublicContent();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  // Site Settings
  static async getSettings(req, res, next) {
    try {
      const data = await ContentService.getSettings();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const data = await ContentService.updateSettings(req.body);
      return res.status(200).json({
        status: "success",
        message: "Pengaturan situs berhasil diperbarui",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Hero Content
  static async getHero(req, res, next) {
    try {
      const data = await ContentService.getHero();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateHero(req, res, next) {
    try {
      const data = await ContentService.updateHero(req.body);
      return res.status(200).json({
        status: "success",
        message: "Konten Hero berhasil diperbarui",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Layanan
  static async getLayananList(req, res, next) {
    try {
      const includeInactive = req.query.all === "true";
      const data = await ContentService.getLayananList(includeInactive);
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async createLayanan(req, res, next) {
    try {
      const data = await ContentService.createLayanan(req.body);
      return res.status(201).json({
        status: "success",
        message: "Layanan berhasil ditambahkan",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateLayanan(req, res, next) {
    try {
      const data = await ContentService.updateLayanan(req.params.id, req.body);
      return res.status(200).json({
        status: "success",
        message: "Layanan berhasil diperbarui",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteLayanan(req, res, next) {
    try {
      await ContentService.deleteLayanan(req.params.id);
      return res.status(200).json({
        status: "success",
        message: "Layanan berhasil dihapus",
      });
    } catch (err) {
      next(err);
    }
  }

  // Berita
  static async getBeritaList(req, res, next) {
    try {
      const { status, limit } = req.query;
      const data = await ContentService.getBeritaList({
        status,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async getBeritaDetail(req, res, next) {
    try {
      const data = await ContentService.getBeritaByIdOrSlug(req.params.idOrSlug);
      if (!data) {
        return res.status(404).json({
          status: "fail",
          message: "Berita tidak ditemukan",
        });
      }
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async createBerita(req, res, next) {
    try {
      const data = await ContentService.createBerita(req.body);
      return res.status(201).json({
        status: "success",
        message: "Berita berhasil diterbitkan",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateBerita(req, res, next) {
    try {
      const data = await ContentService.updateBerita(req.params.id, req.body);
      return res.status(200).json({
        status: "success",
        message: "Berita berhasil diperbarui",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteBerita(req, res, next) {
    try {
      await ContentService.deleteBerita(req.params.id);
      return res.status(200).json({
        status: "success",
        message: "Berita berhasil dihapus",
      });
    } catch (err) {
      next(err);
    }
  }

  // Tentang Kami
  static async getTentang(req, res, next) {
    try {
      const data = await ContentService.getTentang();
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async updateTentang(req, res, next) {
    try {
      const data = await ContentService.updateTentang(req.body);
      return res.status(200).json({
        status: "success",
        message: "Profil Tentang Kami berhasil diperbarui",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  // Testimoni
  static async getTestimoniList(req, res, next) {
    try {
      const includeInactive = req.query.all === "true";
      const data = await ContentService.getTestimoniList(includeInactive);
      return res.status(200).json({ status: "success", data });
    } catch (err) {
      next(err);
    }
  }

  static async createTestimoni(req, res, next) {
    try {
      const data = await ContentService.createTestimoni(req.body);
      return res.status(201).json({
        status: "success",
        message: "Testimoni berhasil ditambahkan",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTestimoni(req, res, next) {
    try {
      const data = await ContentService.updateTestimoni(req.params.id, req.body);
      return res.status(200).json({
        status: "success",
        message: "Testimoni berhasil diperbarui",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTestimoni(req, res, next) {
    try {
      await ContentService.deleteTestimoni(req.params.id);
      return res.status(200).json({
        status: "success",
        message: "Testimoni berhasil dihapus",
      });
    } catch (err) {
      next(err);
    }
  }
}
