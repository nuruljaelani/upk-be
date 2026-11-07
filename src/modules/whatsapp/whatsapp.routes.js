import { Router } from "express";
import { WhatsAppController } from "./whatsapp.controller.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validate.js";
import { updateDeviceSchema, simulatePairSchema } from "./whatsapp.validation.js";

const router = Router();

// Proteksi rute: Hanya dapat diakses oleh role superadmin, admin, operator
router.use(authenticate, authorize("superadmin", "admin", "operator"));

// 1. Ambil data & status perangkat saat ini
router.get("/device", WhatsAppController.getDevice);

// 2. Request koneksi / Generate QR Code pairing
router.post("/device/connect", WhatsAppController.requestConnect);

// 3. Putus koneksi perangkat (Logout)
router.post("/device/disconnect", WhatsAppController.disconnect);

// 4. Refresh & sinkron status terkini dari gateway
router.post("/device/refresh", WhatsAppController.refreshStatus);

// 5. Ubah konfigurasi perangkat (Device ID, nama, nomor telepon)
router.put(
  "/device",
  validateRequest({ body: updateDeviceSchema }),
  WhatsAppController.updateDevice
);

// 6. Endpoint pembantu simulasi scan QR (berguna saat gateway riil belum terpasang)
router.post(
  "/device/simulate-pair",
  validateRequest({ body: simulatePairSchema }),
  WhatsAppController.simulatePair
);

// 7. Kirim test WhatsApp langsung
router.post("/send-test", WhatsAppController.sendTestMessage);

// 8. Pindai jadwal angsuran & kirim pengingat jatuh tempo
router.post("/blast-reminders", WhatsAppController.blastDueReminders);

// 9. Proses antrean outbox manual
router.post("/process-outbox", WhatsAppController.processOutbox);

// 10. Ambil log riwayat pesan outbox
router.get("/outbox", WhatsAppController.getOutboxLogs);

export default router;
