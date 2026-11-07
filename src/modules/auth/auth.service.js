import { eq, or, and, desc, gt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/users.js";
import { members } from "../../db/schema/members.js";
import { otp } from "../../db/schema/otp.js";
import { outbox } from "../../db/schema/outbox.js";
import { waDevices } from "../../db/schema/whatsapp.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "../../utils/auth.js";
import { ApiError } from "../../utils/errors.js";
import { EVENT_TYPE } from "../../config/constant.js";
import { env } from "../../config/env.js";
import { processOutboxMessage } from "../../jobs/outbox.job.js";
import { logger } from "../../utils/logger.js";

export class AuthService {
  // Helper to generate a standardized Member Number (e.g., KOP-2026-XXXX)
  static generateNoAnggota() {
    const year = new Date().getFullYear();
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `KOP-${year}-${randomHex}`;
  }

  // 1. Pengecekan Data Anggota Lama Sebelum Aktivasi (Step 1)
  static async cekDataAktivasi(input) {
    const cleanIdentifier = input.identifier.trim();
    const cleanPhone = (input.no_hp || input.noHp || "").trim();
    const inputTglLahir = input.tgl_lahir || input.tanggalLahir;

    // Cari anggota berdasarkan No. Anggota atau NIK, dicocokkan dengan No. HP
    const foundMembers = await db
      .select()
      .from(members)
      .where(
        and(
          or(
            eq(members.no_anggota, cleanIdentifier),
            eq(members.nik, cleanIdentifier),
          ),
          eq(members.no_hp, cleanPhone),
        ),
      )
      .limit(1);

    if (foundMembers.length === 0) {
      throw ApiError.notFound(
        "Data anggota tidak ditemukan. Pastikan Nomor Anggota/NIK dan No. HP sesuai dengan data yang tercatat di koperasi.",
      );
    }

    const member = foundMembers[0];

    // Jika ada tanggal lahir yang diinput dan di database tercatat, verifikasi kecocokannya
    if (inputTglLahir && member.tanggal_lahir) {
      const dbDate = new Date(member.tanggal_lahir).toISOString().slice(0, 10);
      if (dbDate !== inputTglLahir) {
        throw ApiError.badRequest(
          "Tanggal lahir tidak cocok dengan data tercatat.",
        );
      }
    }

    // Cek apakah akun ini sudah pernah diaktifkan
    if (member.user_id !== null) {
      throw ApiError.conflict(
        "Akun Anda sudah pernah diaktifkan sebelumnya. Silakan langsung login menggunakan Nomor Anggota / No. HP dan Password Anda.",
      );
    }

    // Cek apakah sudah pernah verifikasi OTP
    if (member.is_verified) {
      return {
        id: member.id,
        no_anggota: member.no_anggota,
        nama_lengkap: member.nama_lengkap,
        no_hp: member.no_hp,
        is_verified: true,
        pesan: `Data terverifikasi atas nama ${member.nama_lengkap}. Nomor HP Anda telah terverifikasi, silakan lanjutkan untuk membuat password login Anda.`,
      };
    }

    // Generate OTP and Send to User Mobile Number
    const otpResult = await this.sendOTP(input);

    // Kembalikan preview nama untuk konfirmasi di frontend
    return {
      id: member.id,
      no_anggota: member.no_anggota,
      nama_lengkap: member.nama_lengkap,
      no_hp: member.no_hp,
      is_verified: false,
      pesan: `Data terverifikasi atas nama ${member.nama_lengkap}. Kode OTP verifikasi telah dikirim ke WhatsApp Anda.`,
    };
  }

  // 2. Eksekusi Aktivasi Akun Anggota Lama (Step 2)
  static async aktivasiAkun(input) {
    const cleanIdentifier = input.identifier.trim();
    const cleanPhone = (input.no_hp || input.noHp || "").trim();

    // 1. Verifikasi kecocokan data anggota
    const [memberData] = await db
      .select()
      .from(members)
      .where(
        and(
          or(
            eq(members.no_anggota, cleanIdentifier),
            eq(members.nik, cleanIdentifier),
          ),
          eq(members.no_hp, cleanPhone),
        ),
      )
      .limit(1);

    if (!memberData) {
      throw ApiError.notFound("Data anggota tidak valid untuk aktivasi.");
    }

    if (memberData.user_id !== null) {
      throw ApiError.conflict("Akun ini sudah pernah diaktifkan sebelumnya.");
    }

    if (!memberData.is_verified) {
      throw ApiError.conflict(
        "Akun ini belum terverifikasi. Silahkan verifikasi nomor hp anda terlebih dahulu.",
      );
    }

    // 2. Validasi keunikan username dan email (jika diisi)
    const existingUsers = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(
        or(
          eq(users.username, input.username),
          input.email ? eq(users.email, input.email) : undefined,
        ),
      )
      .limit(1);

    if (existingUsers.length > 0) {
      if (existingUsers[0].username === input.username) {
        throw ApiError.conflict(
          "Username sudah digunakan oleh akun lain. Silakan pilih username lain.",
        );
      }
      if (input.email && existingUsers[0].email === input.email) {
        throw ApiError.conflict("Email sudah terdaftar pada akun lain.");
      }
    }

    // 3. Hash password
    const passwordHash = await hashPassword(input.password);
    const emailVal =
      input.email && input.email.trim() !== "" ? input.email.trim() : null;

    // 4. Eksekusi transaksi atomik (Buat User & Hubungkan ke Member)
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          username: input.username,
          phone: memberData.no_hp,
          email: emailVal,
          password_hash: passwordHash,
          role: "member",
          is_active: true,
        })
        .returning({
          id: users.id,
          username: users.username,
          phone: users.phone,
          email: users.email,
          role: users.role,
          is_active: users.is_active,
        });

      const [updatedMember] = await tx
        .update(members)
        .set({ user_id: newUser.id })
        .where(eq(members.id, memberData.id))
        .returning();

      return { user: newUser, member: updatedMember };
    });

    // 5. Generate token JWT
    const accessTokenTTL = env.JWT_EXPIRES_IN || '15m';
    const refreshTokenTTL = env.JWT_REFRESH_EXPIRES_IN || '7d';
    const payload = {
      user_id: result.user.id,
      username: result.user.username,
      role: result.user.role,
    }
    const accessToken = generateToken(payload, accessTokenTTL);
    const refreshToken = generateToken(payload, refreshTokenTTL);

    const token = {
      accessToken,
      refreshToken,
    }

    const user = {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
    }

    const member = {
      id: result.member.id,
      no_anggota: result.member.no_anggota,
      nama_lengkap: result.member.nama_lengkap,
    }

    return {
      token,
      user,
      member,
    };
  }

  // 3. Login Fleksibel (Username / No HP / No Anggota / Email)
  static async login(input) {
    const rawIdentifier = input.identifier.trim();

    // 1. Coba cari langsung di tabel users (username, phone, atau email)
    const foundUsers = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, rawIdentifier),
          eq(users.phone, rawIdentifier),
          eq(users.email, rawIdentifier),
        ),
      )
      .limit(1);

    let user = foundUsers.length > 0 ? foundUsers[0] : null;

    // 2. Jika tidak ditemukan di tabel users, cek apakah identifier adalah Nomor Anggota di tabel members
    if (!user) {
      const [foundMember] = await db
        .select()
        .from(members)
        .where(eq(members.no_anggota, rawIdentifier))
        .limit(1);

      if (foundMember) {
        if (!foundMember.user_id) {
          // Kasus UX Penting: Anggota lama belum aktivasi akun
          throw ApiError.badRequest(
            `Nomor Anggota ${rawIdentifier} (${foundMember.nama_lengkap}) terdaftar tetapi belum diaktifkan. Silakan klik menu 'Aktivasi Akun' untuk membuat password Anda.`,
          );
        }

        // Ambil user terkait
        const [linkedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, foundMember.user_id))
          .limit(1);

        user = linkedUser || null;
      }
    }

    if (!user) {
      throw ApiError.unauthorized(
        "Username, No. Handphone, No. Anggota, atau Password salah.",
      );
    }

    if (!user.is_active) {
      throw ApiError.forbidden(
        "Akun Anda telah dinonaktifkan. Silakan hubungi pengurus koperasi.",
      );
    }

    // 3. Verifikasi Password
    const isPasswordValid = await verifyPassword(
      input.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw ApiError.unauthorized(
        "Username, No. Handphone, No. Anggota, atau Password salah.",
      );
    }

    // 4. Jika role member, ambil profil anggota
    let memberProfile = null;
    if (user.role === "member") {
      const [found] = await db
        .select()
        .from(members)
        .where(eq(members.user_id, user.id))
        .limit(1);
      memberProfile = found || null;
    }

    // 5. Generate JWT Token
    const payload = {
      user_id: user.id,
      username: user.username,
      role: user.role
    }
    let accessTokenTTL = env.JWT_EXPIRES_IN || '15m';
    let refreshTokenTTL = env.JWT_REFRESH_EXPIRES_IN || '7d';
    const accessToken = generateToken(payload, accessTokenTTL);
    const refreshToken = generateToken(payload, refreshTokenTTL);

    const token = {
      accessToken,
      refreshToken,
    }

    const { password_hash: _, ...safeUser } = user;

    return {
      user: safeUser,
      member: memberProfile,
      token
    };
  }

  // 4. Registrasi Calon Anggota Baru (Pendaftaran Baru dari Luar)
  static async registerMember(input) {
    const emailVal =
      input.email && input.email.trim() !== "" ? input.email.trim() : null;

    // Cek username
    const existingUser = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.username, input.username))
      .limit(1);

    if (existingUser.length > 0) {
      throw ApiError.conflict("Username sudah digunakan");
    }

    // Cek NIK
    const existingNik = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.nik, input.nik))
      .limit(1);

    if (existingNik.length > 0) {
      throw ApiError.conflict("NIK sudah terdaftar sebagai anggota");
    }

    const passwordHash = await hashPassword(input.password);
    const noAnggota = this.generateNoAnggota();
    const phoneVal = input.no_hp || input.noHp;

    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          username: input.username,
          phone: phoneVal,
          email: emailVal,
          password_hash: passwordHash,
          role: "member",
          is_active: true,
        })
        .returning({
          id: users.id,
          username: users.username,
          phone: users.phone,
          email: users.email,
          role: users.role,
          is_active: users.is_active,
          created_at: users.created_at,
        });

      const [newMember] = await tx
        .insert(members)
        .values({
          user_id: newUser.id,
          no_anggota: noAnggota,
          nik: input.nik,
          nama_lengkap: input.nama_lengkap || input.namaLengkap,
          tempat_lahir: input.tempat_lahir || input.tempatLahir,
          tanggal_lahir:
            input.tanggal_lahir || input.tgl_lahir || input.tanggalLahir,
          jenis_kelamin: input.jenis_kelamin || input.jenisKelamin,
          no_hp: phoneVal,
          alamat: input.alamat,
          pekerjaan: input.pekerjaan,
          status_keanggotaan: "active",
        })
        .returning();

      return { user: newUser, member: newMember };
    });

    const token = generateToken({
      userId: result.user.id,
      username: result.user.username,
      email: result.user.email || "",
      role: result.user.role,
      memberId: result.member.id,
    });

    return {
      user: result.user,
      member: result.member,
      token,
    };
  }

  // 5. Get Current User Profil
  static async getCurrentUser(userId) {
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (foundUsers.length === 0) {
      throw ApiError.notFound("User tidak ditemukan");
    }

    const user = foundUsers[0];
    const { password_hash: _, ...safeUser } = user;

    let memberProfile = null;
    const foundMembers = await db
      .select()
      .from(members)
      .where(eq(members.user_id, user.id))
      .limit(1);
    memberProfile = foundMembers.length > 0 ? foundMembers[0] : null;

    return {
      user: safeUser,
      member: memberProfile,
    };
  }

  static async sendOTP(input) {
    const cleanPhone = (input.no_hp || input.noHp || "").trim();

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    let savedOutbox = null;
    await db.transaction(async (tx) => {
      // Cek jika user meminta ulang OTP dalam 60 detik terakhir
      const foundOtp = await tx
        .select()
        .from(otp)
        .where(
          and(
            eq(otp.phone, cleanPhone),
            eq(otp.purpose, "aktivasi"),
            gt(otp.created_at, new Date(Date.now() - 60 * 1000)),
          ),
        )
        .orderBy(desc(otp.created_at))
        .limit(1);

      if (foundOtp.length > 0) {
        throw ApiError.badRequest(
          "Kode OTP sudah dikirim, silakan tunggu 60 detik",
        );
      }

      // Insert OTP ke DB
      await tx.insert(otp).values({
        identifier: input.identifier,
        phone: cleanPhone,
        otp: otpCode,
        purpose: "aktivasi",
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      });

      // Cari device WhatsApp yang aktif dari database
      const activeDevices = await db
        .select()
        .from(waDevices)
        .where(eq(waDevices.is_active, true))
        .limit(1);

      const deviceID =
        activeDevices[0]?.device_id ||
        process.env.WA_DEVICE_ID ||
        "koperasi-app";
      const topic = process.env.MESSAGE_BROKER == 'kafka' ? process.env.KAFKA_TOPIC : process.env.RABBITMQ_EXCHANGE_NAME;
      const headers = {
        event_type: "whatsapp.otp_requested",
        event_id: crypto.randomUUID(),
      };

      // insert ke outbox
      const [newOutbox] = await tx
        .insert(outbox)
        .values({
          topic: topic,
          event_key: EVENT_TYPE.whatsapp_otp_requested,
          headers: headers,
          payload: {
            event_id: crypto.randomUUID(),
            event_type: EVENT_TYPE.whatsapp_otp_requested,
            device_id: deviceID,
            phone: cleanPhone,
            otp: otpCode,
            message: `Kode OTP aktivasi Anda: ${otpCode}`,
          },
          status: "PENDING",
        })
        .returning();

      savedOutbox = newOutbox;
    });

    if (savedOutbox) {
      processOutboxMessage(savedOutbox).catch((err) => {
        logger.warn(
          {
            error: err.message,
            outboxId: savedOutbox.id,
          },
          "Fast path outbox failed, cron will retry",
        );
      });
    }

    return { otp: otpCode };
  }

  static async verifikasiOTP(input) {
    const cleanPhone = (input.no_hp || input.noHp || "").trim();
    const cleanOTP = input.otp.trim();

    await db.transaction(async (tx) => {
      const foundOtp = await tx
        .select()
        .from(otp)
        .where(
          and(
            eq(otp.phone, cleanPhone),
            eq(otp.purpose, "aktivasi"),
            eq(otp.otp, cleanOTP),
          ),
        )
        .orderBy(desc(otp.created_at))
        .limit(1);

      if (foundOtp.length === 0) {
        throw ApiError.notFound("Kode OTP tidak ditemukan");
      }

      const record = foundOtp[0];

      if (record.otp !== cleanOTP) {
        throw ApiError.badRequest("Kode OTP tidak valid");
      }

      if (record.expires_at < new Date()) {
        throw ApiError.badRequest("Kode OTP sudah kedaluwarsa");
      }

      await tx.delete(otp).where(eq(otp.id, record.id));

      // UPDATE user is_verified = true
      await tx.update(members).set({
        status_keanggotaan: "active",
        is_verified: true,
      }).where(
        and(
          eq(members.no_hp, cleanPhone),
          or(eq(members.no_anggota, input.identifier), eq(members.nik, input.identifier))
        )
      );
    });

    return { verified: true, message: "Verifikasi OTP berhasil." };
  }

  static async refreshAccessToken(tokenInput) {
    const decoded = verifyToken(tokenInput);
    const [user] = await db.select().from(users).where(eq(users.id, decoded.user_id)).limit(1);
    if (user.length === 0) {
      throw ApiError.notFound("User not found");
    }
    const { password_hash: _, ...safeUser } = user;
    let accessTokenTTL = env.JWT_EXPIRES_IN || '15m';
    let refreshTokenTTL = env.JWT_REFRESH_EXPIRES_IN || '7d';
    const payload = {
      user_id: user.id,
      username: user.username,
      role: user.role,
    }
    const accessToken = generateToken(payload, accessTokenTTL);
    const refreshToken = generateToken(payload, refreshTokenTTL);

    const token = {
      accessToken,
      refreshToken,
    }

    return token;
  }
}
