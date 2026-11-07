import { AuthService } from "./auth.service.js";
import { ApiResponse } from "../../utils/response.js";
import { env } from "../../config/env.js";

export class AuthController {
  // POST /api/v1/auth/aktivasi/cek (Step 1 Aktivasi)
  static async cekAktivasi(req, res, next) {
    try {
      const result = await AuthService.cekDataAktivasi(req.body);
      return ApiResponse.success(
        res,
        result,
        "Data anggota terverifikasi, silakan lanjutkan aktivasi"
      );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/aktivasi (Step 2 Aktivasi)
  static async aktivasi(req, res, next) {
    try {
      const result = await AuthService.aktivasiAkun(req.body);

      // Simpan refreshToken di cookies
      res.cookie("refreshToken", result.token.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      delete result.token.refreshToken;
      return ApiResponse.success(
        res,
        result,
        "Aktivasi akun anggota berhasil",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/register (Pendaftaran Baru)
  static async register(req, res, next) {
    try {
      const result = await AuthService.registerMember(req.body);
      return ApiResponse.success(
        res,
        result,
        "Pendaftaran anggota koperasi berhasil",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/login (Multi-Identifier Login)
  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);

      // Save refresh token ke cookie
      res.cookie("refreshToken", result.token.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      delete result.token.refreshToken;
      return ApiResponse.success(res, result, "Login berhasil");
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/auth/me (Profil Saya)
  static async getMe(req, res, next) {
    try {
      const userId = req.user.user_id || req.user.userId;
      const result = await AuthService.getCurrentUser(userId);
      return ApiResponse.success(res, result, "Profil user berhasil diambil");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/send-otp (Kirim OTP)
  static async sendOtp(req, res, next) {
    try {
      const result = await AuthService.sendOTP(req.body);
      return ApiResponse.success(res, result, "OTP berhasil dikirim");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/verify-otp (Verifikasi OTP)
  static async verifyOTP(req, res, next) {
    try {
      const result = await AuthService.verifikasiOTP(req.body);
      return ApiResponse.success(res, result, "OTP berhasil diverifikasi");
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/refresh-token (Refresh Access Token)
  static async refreshAccessToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await AuthService.refreshAccessToken(refreshToken);
      
      // Save refresh token ke cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      delete result.refreshToken;
      return ApiResponse.success(res, result, "Refresh access token berhasil");
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      res.clearCookie("refreshToken");
      return ApiResponse.success(res, {}, "Logout berhasil");
    } catch (error) {
      next(error);
    }
  }
}
