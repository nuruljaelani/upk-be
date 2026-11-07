import { WhatsAppService } from "./whatsapp.service.js";

let outboxInterval = null;
let dueReminderInterval = null;
let isProcessing = false;

/**
 * Memulai worker latar belakang (Background Outbox & Due Reminder Worker).
 */
export function startOutboxWorker({
  intervalMs = 10000, // Periksa pesan antrean setiap 10 detik
  dueReminderIntervalMs = 1000 * 60 * 60 * 4, // Pindai jadwal jatuh tempo setiap 4 jam
} = {}) {
  if (outboxInterval) {
    console.log("[Outbox Worker] Worker sudah berjalan.");
    return;
  }

  console.log("⚡ [Outbox Worker] Memulai WhatsApp Notification & Outbox Worker...");

  // 1. Polling Outbox Messages
  outboxInterval = setInterval(async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const result = await WhatsAppService.processOutboxBatch(15);
      if (result.processed > 0) {
        console.log(
          `📬 [Outbox Worker] Berhasil memproses ${result.successful}/${result.processed} pesan WhatsApp.`
        );
      }
    } catch (err) {
      console.warn("[Outbox Worker] Error saat memproses batch outbox:", err.message);
    } finally {
      isProcessing = false;
    }
  }, intervalMs);

  // 2. Scan Jadwal Jatuh Tempo Pinjaman (Jalankan langsung saat start + berkala)
  const runDueScan = async () => {
    try {
      const res = await WhatsAppService.sendDueReminders(3);
      if (res.enqueuedReminders > 0) {
        console.log(
          `🔔 [Outbox Worker] Memindai jatuh tempo pinjaman: ${res.enqueuedReminders} pengingat dimasukkan ke antrean.`
        );
      }
    } catch (err) {
      console.warn("[Outbox Worker] Gagal memindai jadwal jatuh tempo:", err.message);
    }
  };

  // Jalankan scan awal setelah 5 detik startup
  setTimeout(runDueScan, 5000);

  dueReminderInterval = setInterval(runDueScan, dueReminderIntervalMs);
}

/**
 * Menghentikan worker jika proses di-terminate.
 */
export function stopOutboxWorker() {
  if (outboxInterval) {
    clearInterval(outboxInterval);
    outboxInterval = null;
  }
  if (dueReminderInterval) {
    clearInterval(dueReminderInterval);
    dueReminderInterval = null;
  }
  console.log("⏹️ [Outbox Worker] Worker dihentikan.");
}
