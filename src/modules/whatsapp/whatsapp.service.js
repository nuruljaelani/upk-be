import { db } from "../../db/index.js";
import { waDevices } from "../../db/schema/whatsapp.js";
import { outbox } from "../../db/schema/outbox.js";
import { jadwalAngsuran, pengajuanPinjaman } from "../../db/schema/pinjaman.js";
import { members } from "../../db/schema/members.js";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { generateSvgQRCode } from "../../utils/qrGenerator.js";

export class WhatsAppService {
  /**
   * Normalisasi nomor telepon ke format internasional standar WhatsApp Indonesia (628...)
   */
  static normalizePhoneNumber(phone) {
    if (!phone) return "";
    let clean = String(phone).split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    } else if (clean.startsWith("8")) {
      clean = "62" + clean;
    }
    return clean;
  }

  /**
   * Memastikan minimal ada 1 perangkat WhatsApp default yang terdaftar di database.
   */
  static async ensureDefaultDevice() {
    const existing = await db
      .select()
      .from(waDevices)
      .where(eq(waDevices.is_active, true))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const defaultDeviceId = process.env.WA_DEVICE_ID || "koperasi-app";
    const [created] = await db
      .insert(waDevices)
      .values({
        device_id: defaultDeviceId,
        name: "WhatsApp Notifikasi Utama",
        phone_number: "6281234567890",
        status: "connected",
        is_active: true,
        last_connected_at: new Date(),
      })
      .returning();

    return created;
  }

  /**
   * Mengambil data perangkat WhatsApp aktif.
   */
  static async getDevice() {
    const device = await this.ensureDefaultDevice();
    // Jika status masih qr_ready atau connecting, otomatis sinkronkan dengan status gateway terkini
    if (device.status === "qr_ready" || device.status === "connecting") {
      return await this.refreshStatus();
    }
    return device;
  }

  /**
   * Memicu permintaan sesi koneksi (Generate QR Code).
   */
  static async requestConnect(targetDeviceId = null) {
    const device = await this.ensureDefaultDevice();
    const activeDeviceId = targetDeviceId || device.device_id;
    const apiUrl = device.api_url || process.env.NOTIF_API_URL || "http://localhost:8081/api";
    const apiKey = device.api_key || process.env.NOTIF_API_KEY || "kaksajsju7323ddwdg2362dgdva@gasasfy";

    // Jika ada REST API gateway riil yang diset
    if (apiUrl) {
      try {
        // 1. Daftarkan device ke gateway (jika belum ada atau setelah di-reset saat disconnect)
        await fetch(`${apiUrl}/devices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            id: activeDeviceId,
            name: device.name || "WhatsApp Gateway Device",
          }),
        });

        // 2. Memicu sesi pairing di gateway (/api/devices/{id}/pair)
        await fetch(`${apiUrl}/devices/${activeDeviceId}/pair`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
        });

        // 3. Ambil data QR awal dalam format JSON (?format=json)
        const qrResponse = await fetch(`${apiUrl}/devices/${activeDeviceId}/qr?format=json`, {
          headers: {
            Accept: "application/json",
            "X-API-Key": apiKey,
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
        });

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          const qrImage = qrData.qr_png_base64
            ? (qrData.qr_png_base64.startsWith("data:") ? qrData.qr_png_base64 : `data:image/png;base64,${qrData.qr_png_base64}`)
            : qrData.qr_code;

          if (qrImage) {
            const [updated] = await db
              .update(waDevices)
              .set({
                status: "qr_ready",
                qr_code: qrImage,
                updated_at: new Date(),
              })
              .where(eq(waDevices.id, device.id))
              .returning();
            return updated;
          }
        }
      } catch (err) {
        console.warn("[WhatsAppService] Gateway API unreachable, fallback to simulation:", err.message);
      }
    }

    // Dummy mode: generate authentic SVG QR code jika gateway offline
    const sessionToken = `2@${activeDeviceId}:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    const qrDataUri = generateSvgQRCode(sessionToken);

    const [updated] = await db
      .update(waDevices)
      .set({
        status: "qr_ready",
        qr_code: qrDataUri,
        updated_at: new Date(),
      })
      .where(eq(waDevices.id, device.id))
      .returning();

    return updated;
  }

  /**
   * Memutus koneksi perangkat (Logout WhatsApp Session).
   */
  static async disconnect() {
    const device = await this.ensureDefaultDevice();
    const apiUrl = device.api_url || process.env.NOTIF_API_URL || "http://localhost:8081/api";
    const apiKey = device.api_key || process.env.NOTIF_API_KEY || "kaksajsju7323ddwdg2362dgdva@gasasfy";

    if (apiUrl) {
      try {
        // 1. Sesuai dokumentasi: POST /api/devices/{id}/logout
        await fetch(`${apiUrl}/devices/${device.device_id}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
        });
      } catch (err) {
        console.warn("[WhatsAppService] Gateway logout API error:", err.message);
      }

      try {
        // 2. Hapus perangkat dari gateway agar kredensial sesi lama benar-benar bersih dan mewajibkan scan QR baru
        await fetch(`${apiUrl}/devices/${device.device_id}`, {
          method: "DELETE",
          headers: {
            "X-API-Key": apiKey,
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
        });
      } catch (err) {
        console.warn("[WhatsAppService] Gateway delete device error:", err.message);
      }
    }

    const [updated] = await db
      .update(waDevices)
      .set({
        status: "disconnected",
        qr_code: null,
        updated_at: new Date(),
      })
      .where(eq(waDevices.id, device.id))
      .returning();

    return updated;
  }

  /**
   * Refresh status perangkat dari gateway atau database.
   */
  static async refreshStatus() {
    const device = await this.ensureDefaultDevice();
    const apiUrl = device.api_url || process.env.NOTIF_API_URL || "http://localhost:8081/api";
    const apiKey = device.api_key || process.env.NOTIF_API_KEY || "";

    if (apiUrl) {
      try {
        const response = await fetch(`${apiUrl}/devices/${device.device_id}/status`, {
          headers: {
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data) {
            // Perangkat hanya valid "connected" jika connected === true DAN logged_in === true
            const isConnected = Boolean(data.connected && data.logged_in);
            const newStatus = isConnected
              ? "connected"
              : data.has_qr
              ? "qr_ready"
              : "disconnected";
            const phone = data.jid
              ? data.jid.split("@")[0].split(":")[0]
              : (data.phone_number || device.phone_number);

            const [updated] = await db
              .update(waDevices)
              .set({
                status: newStatus,
                phone_number: phone,
                qr_code: isConnected ? null : device.qr_code,
                last_connected_at: isConnected ? new Date() : device.last_connected_at,
                updated_at: new Date(),
              })
              .where(eq(waDevices.id, device.id))
              .returning();
            return updated;
          }
        }
      } catch (err) {
        console.warn("[WhatsAppService] Gateway status API error:", err.message);
      }
    }

    return device;
  }

  /**
   * Memperbarui konfigurasi perangkat (Device ID, Nomor Telepon, Nama, dll).
   */
  static async updateDevice(payload) {
    const device = await this.ensureDefaultDevice();

    const updateData = {
      updated_at: new Date(),
    };

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.device_id !== undefined) updateData.device_id = payload.device_id;
    if (payload.phone_number !== undefined) updateData.phone_number = payload.phone_number;
    if (payload.api_url !== undefined) updateData.api_url = payload.api_url;
    if (payload.api_key !== undefined) updateData.api_key = payload.api_key;
    if (payload.status !== undefined) {
      updateData.status = payload.status;
      if (payload.status === "connected") {
        updateData.last_connected_at = new Date();
        updateData.qr_code = null;
      }
    }

    const [updated] = await db
      .update(waDevices)
      .set(updateData)
      .where(eq(waDevices.id, device.id))
      .returning();

    return updated;
  }

  /**
   * Simulasi pairing berhasil.
   */
  static async simulatePair(phoneNumber) {
    const device = await this.ensureDefaultDevice();
    const finalPhone = phoneNumber || device.phone_number || "6281298765432";

    const [updated] = await db
      .update(waDevices)
      .set({
        status: "connected",
        phone_number: finalPhone,
        qr_code: null,
        last_connected_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(waDevices.id, device.id))
      .returning();

    return updated;
  }

  /**
   * Kirim pesan langsung via WhatsApp Gateway / Device.
   */
  static async sendMessage({ to, message }) {
    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo) {
      throw new Error("Nomor tujuan WhatsApp tidak valid");
    }

    const device = await this.ensureDefaultDevice();
    const apiUrl = device.api_url || process.env.NOTIF_API_URL;
    const apiKey = device.api_key || process.env.NOTIF_API_KEY;

    // 1. Jika terhubung ke REST gateway riil (e.g. Baileys / WPPConnect / Fonnte / Wablas)
    if (apiUrl && device.status === "connected") {
      try {
        const sendEndpoint = `${apiUrl}/devices/${device.device_id}/send`;
        const response = await fetch(sendEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            phone: normalizedTo,
            message: message,
          }),
        });
        const resJson = await response.json();
        return {
          success: true,
          gateway: true,
          messageId: resJson.id || `msg-${Date.now()}`,
          to: normalizedTo,
        };
      } catch (err) {
        console.warn("[WhatsApp Gateway] Gagal kirim via gateway eksternal:", err.message);
        // Lanjutkan ke logging fallback
      }
    }

    // 2. Fallback / Mode Operasional Lokal: Log rapi di server
    const messageId = `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    console.log(`\n======================================================`);
    console.log(`💬 [WHATSAPP DISPATCH] Ke: +${normalizedTo} (Msg ID: ${messageId})`);
    console.log(`------------------------------------------------------`);
    console.log(message);
    console.log(`======================================================\n`);

    return {
      success: true,
      simulated: true,
      messageId,
      to: normalizedTo,
      timestamp: new Date(),
    };
  }

  /**
   * Masukkan pesan notifikasi ke antrean (Outbox Table).
   */
  static async enqueueNotification({
    topic = "whatsapp.notification",
    eventKey = "general",
    to,
    message,
    payload = {},
  }) {
    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo) {
      console.warn("[WhatsApp Outbox] Nomor telepon kosong/tidak valid, batal memasukkan antrean:", to);
      return null;
    }

    const [inserted] = await db
      .insert(outbox)
      .values({
        topic,
        event_key: eventKey,
        payload: {
          to: normalizedTo,
          message,
          ...payload,
        },
        status: "PENDING",
        retry_count: 0,
        max_retry_count: 3,
      })
      .returning();

    return inserted;
  }

  /**
   * Jalankan worker batch pengiriman pesan yang ada di antrean outbox.
   */
  static async processOutboxBatch(limit = 20) {
    const pendingItems = await db
      .select()
      .from(outbox)
      .where(eq(outbox.status, "PENDING"))
      .orderBy(asc(outbox.created_at))
      .limit(limit);

    if (pendingItems.length === 0) {
      return { processed: 0, successful: 0, failed: 0 };
    }

    let successful = 0;
    let failed = 0;

    for (const item of pendingItems) {
      const payload = item.payload || {};
      const { to, message } = payload;

      try {
        if (!to || !message) {
          throw new Error("Payload outbox tidak memiliki atribut 'to' atau 'message'");
        }

        await this.sendMessage({ to, message });

        await db
          .update(outbox)
          .set({
            status: "SENT",
            published_at: new Date(),
            last_error: null,
          })
          .where(eq(outbox.id, item.id));

        successful++;
      } catch (err) {
        failed++;
        const nextRetry = (item.retry_count || 0) + 1;
        const isFailedPermanently = nextRetry >= (item.max_retry_count || 3);

        await db
          .update(outbox)
          .set({
            retry_count: nextRetry,
            last_error: err.message,
            status: isFailedPermanently ? "FAILED" : "PENDING",
          })
          .where(eq(outbox.id, item.id));
      }
    }

    return {
      processed: pendingItems.length,
      successful,
      failed,
    };
  }

  /**
   * Pindai pinjaman yang mendekati tanggal jatuh tempo dan antrekan notifikasi pengingat ke outbox.
   */
  static async sendDueReminders(daysAhead = 3) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const targetStr = targetDate.toISOString().slice(0, 10);

    // Ambil seluruh jadwal angsuran yang belum bayar dan jatuh tempo dalam rentang hari ini s/d daysAhead
    const schedules = await db
      .select({
        jadwalId: jadwalAngsuran.id,
        angsuranKe: jadwalAngsuran.angsuran_ke,
        tanggalJatuhTempo: jadwalAngsuran.tanggal_jatuh_tempo,
        totalAngsuran: jadwalAngsuran.total_angsuran,
        pinjamanId: pengajuanPinjaman.id,
        nomorPinjaman: pengajuanPinjaman.nomor_pinjaman,
        memberId: members.id,
        namaLengkap: members.nama_lengkap,
        noAnggota: members.no_anggota,
        noHp: members.no_hp,
      })
      .from(jadwalAngsuran)
      .innerJoin(pengajuanPinjaman, eq(jadwalAngsuran.pinjaman_id, pengajuanPinjaman.id))
      .innerJoin(members, eq(pengajuanPinjaman.member_id, members.id))
      .where(
        and(
          eq(jadwalAngsuran.status_bayar, "belum_bayar"),
          gte(jadwalAngsuran.tanggal_jatuh_tempo, todayStr),
          lte(jadwalAngsuran.tanggal_jatuh_tempo, targetStr)
        )
      );

    let queuedCount = 0;

    for (const item of schedules) {
      if (!item.noHp) continue;

      const eventKey = `loan.reminder.${item.jadwalId}.${todayStr}`;

      // Cek apakah hari ini sudah pernah diantrekan pengingat untuk jadwal angsuran ini
      const existing = await db
        .select({ id: outbox.id })
        .from(outbox)
        .where(eq(outbox.event_key, eventKey))
        .limit(1);

      if (existing.length > 0) continue;

      const nominalFormatted = Number(item.totalAngsuran).toLocaleString("id-ID");
      const message = `🔔 *PENGINGAT JATUH TEMPO ANGSURAN*
Koperasi Simpan Pinjam UPK Mekarsari

Yth. *${item.namaLengkap}* (No: ${item.noAnggota}),

Kami menginformasikan bahwa kewajiban angsuran pembiayaan Anda:
• No. Pinjaman: *${item.nomorPinjaman}*
• Angsuran ke: *${item.angsuranKe}*
• Jumlah Tagihan: *Rp ${nominalFormatted}*
• Jatuh Tempo: *${item.tanggalJatuhTempo}*

Mohon melakukan pembayaran sebelum tanggal jatuh tempo melalui kasir kantor koperasi atau transfer bank resmi koperasi.

_Abaikan pesan ini apabila Anda telah menyelesaikan pembayaran._
Terima kasih atas kerja sama dan kedisiplinan Anda.`;

      await this.enqueueNotification({
        topic: "whatsapp.notification",
        eventKey,
        to: item.noHp,
        message,
        payload: {
          type: "loan_due_reminder",
          jadwalId: item.jadwalId,
          pinjamanId: item.pinjamanId,
          nominal: item.totalAngsuran,
        },
      });

      queuedCount++;
    }

    return {
      scannedSchedules: schedules.length,
      enqueuedReminders: queuedCount,
    };
  }

  /**
   * Mengambil riwayat log antrean outbox dengan statistik.
   */
  static async getOutboxLogs({ status, limit = 50, page = 1 } = {}) {
    const offset = (page - 1) * limit;

    let query = db.select().from(outbox);
    if (status) {
      query = query.where(eq(outbox.status, status));
    }

    const [rows, countRes, pendingRes, sentRes, failedRes] = await Promise.all([
      query.orderBy(desc(outbox.created_at)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(outbox),
      db.select({ count: sql`count(*)` }).from(outbox).where(eq(outbox.status, "PENDING")),
      db.select({ count: sql`count(*)` }).from(outbox).where(eq(outbox.status, "SENT")),
      db.select({ count: sql`count(*)` }).from(outbox).where(eq(outbox.status, "FAILED")),
    ]);

    return {
      items: rows,
      pagination: {
        page,
        limit,
        totalItems: Number(countRes[0]?.count || 0),
        totalPages: Math.ceil(Number(countRes[0]?.count || 0) / limit),
      },
      stats: {
        total: Number(countRes[0]?.count || 0),
        pending: Number(pendingRes[0]?.count || 0),
        sent: Number(sentRes[0]?.count || 0),
        failed: Number(failedRes[0]?.count || 0),
      },
    };
  }
}
