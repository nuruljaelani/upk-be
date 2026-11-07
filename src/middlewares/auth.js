import { verifyToken } from "../utils/auth.js";
import { ApiResponse } from "../utils/response.js";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return ApiResponse.error(res, "Akses ditolak. Token tidak disediakan atau format salah.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return ApiResponse.error(res, "Sesi login tidak valid atau sudah kedaluwarsa.", 401);
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, "Autentikasi diperlukan sebelum otorisasi.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        "Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.",
        403
      );
    }

    next();
  };
}
