import { WhatsAppService } from "./whatsapp.service.js";
import { ApiResponse } from "../../utils/response.js";

export class WhatsAppController {
  static async getDevice(req, res, next) {
    try {
      const device = await WhatsAppService.getDevice();
      return ApiResponse.success(res, device, "Data perangkat WhatsApp berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  static async requestConnect(req, res, next) {
    try {
      const device = await WhatsAppService.requestConnect();
      return ApiResponse.success(res, device, "Sesi QR code WhatsApp berhasil digenerate");
    } catch (error) {
      next(error);
    }
  }

  static async disconnect(req, res, next) {
    try {
      const device = await WhatsAppService.disconnect();
      return ApiResponse.success(res, device, "Koneksi WhatsApp berhasil diputus");
    } catch (error) {
      next(error);
    }
  }

  static async refreshStatus(req, res, next) {
    try {
      const device = await WhatsAppService.refreshStatus();
      return ApiResponse.success(res, device, "Status WhatsApp berhasil diperbarui");
    } catch (error) {
      next(error);
    }
  }

  static async updateDevice(req, res, next) {
    try {
      const device = await WhatsAppService.updateDevice(req.body);
      return ApiResponse.success(res, device, "Pengaturan perangkat WhatsApp berhasil disimpan");
    } catch (error) {
      next(error);
    }
  }

  static async simulatePair(req, res, next) {
    try {
      const { phone_number } = req.body || {};
      const device = await WhatsAppService.simulatePair(phone_number);
      return ApiResponse.success(res, device, "Simulasi scan QR berhasil, perangkat terhubung!");
    } catch (error) {
      next(error);
    }
  }

  // Kirim Test Pesan Langsung
  static async sendTestMessage(req, res, next) {
    try {
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({
          status: "fail",
          message: "Parameter 'to' dan 'message' wajib diisi",
        });
      }
      const result = await WhatsAppService.sendMessage({ to, message });
      return ApiResponse.success(res, result, "Pesan uji coba WhatsApp berhasil dikirim");
    } catch (error) {
      next(error);
    }
  }

  // Pindai & Kirim Pengingat Jatuh Tempo Angsuran Pinjaman
  static async blastDueReminders(req, res, next) {
    try {
      const daysAhead = req.body.daysAhead ? parseInt(req.body.daysAhead, 10) : 3;
      const result = await WhatsAppService.sendDueReminders(daysAhead);
      
      // Langsung proses antrean outbox batch pertama
      const processResult = await WhatsAppService.processOutboxBatch(20);

      return ApiResponse.success(
        res,
        {
          ...result,
          dispatchedImmediately: processResult,
        },
        `Berhasil memindai ${result.scannedSchedules} jadwal angsuran, ${result.enqueuedReminders} pengingat dimasukkan ke antrean WhatsApp`
      );
    } catch (error) {
      next(error);
    }
  }

  // Proses Manual Antrean Outbox
  static async processOutbox(req, res, next) {
    try {
      const limit = req.body.limit ? parseInt(req.body.limit, 10) : 20;
      const result = await WhatsAppService.processOutboxBatch(limit);
      return ApiResponse.success(res, result, `Berhasil memproses ${result.successful}/${result.processed} pesan antrean`);
    } catch (error) {
      next(error);
    }
  }

  // Log Pengiriman Outbox
  static async getOutboxLogs(req, res, next) {
    try {
      const { status, limit, page } = req.query;
      const data = await WhatsAppService.getOutboxLogs({
        status,
        limit: limit ? parseInt(limit, 10) : 20,
        page: page ? parseInt(page, 10) : 1,
      });
      return ApiResponse.success(res, data, "Riwayat pengiriman WhatsApp outbox berhasil dimuat");
    } catch (error) {
      next(error);
    }
  }
}
