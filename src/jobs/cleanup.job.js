import cron from "node-cron";
import { lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { otp } from "../db/schema/otp.js";
import { logger } from "../utils/logger.js";

// Berjalan setiap jam (menit 0)
export const initCleanupJobs = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      // Hapus semua OTP yang sudah lewat masa berlaku
      await db.delete(otp).where(lt(otp.expires_at, now));
      logger.info({ timestamp: now.toISOString() }, "[CLEANUP] Berhasil membersihkan OTP kedaluwarsa");
    } catch (error) {
      logger.error({ error: error.message }, "[CLEANUP] Gagal membersihkan OTP");
    }
  });
};
