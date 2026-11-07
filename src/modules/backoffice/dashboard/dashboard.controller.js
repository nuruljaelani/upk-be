import { DashboardService } from "./dashboard.service.js";
import { ApiResponse } from "../../../utils/response.js";

export class DashboardController {
  static async getDashboard(_req, res, next) {
    try {
      const stats = await DashboardService.getDashboardStats();
      return ApiResponse.success(res, stats, "Statistik dashboard berhasil diambil");
    } catch (error) {
      next(error);
    }
  }
}
