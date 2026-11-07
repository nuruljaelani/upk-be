import { defineRelations } from "drizzle-orm";
import { users } from "./users.js";
import { members } from "./members.js";
import {
  jenisSimpanan,
  rekeningSimpanan,
  mutasiSimpanan,
} from "./simpanan.js";
import {
  jenisPinjaman,
  pengajuanPinjaman,
  jadwalAngsuran,
  pembayaranAngsuran,
} from "./pinjaman.js";
import { otp } from "./otp.js";
import { waDevices } from "./whatsapp.js";

export * from "./users.js";
export * from "./members.js";
export * from "./simpanan.js";
export * from "./pinjaman.js";
export * from "./otp.js";
export * from "./whatsapp.js";
export * from "./outbox.js";
export * from "./content.js";
export * from "./settings.js";

// Relasi User
export const usersRelations = defineRelations({
  users, 
  members, 
  rekeningSimpanan, 
  jenisSimpanan, 
  jenisPinjaman, 
  pengajuanPinjaman, 
  pembayaranAngsuran,
  mutasiSimpanan,
  jadwalAngsuran,
  otp,
}, (r) => ({
  users: {
    member: r.one.members({
      from: r.users.id,
      to: r.members.user_id,
    }),
  },
  members: {
    rekeningSimpanan: r.many.rekeningSimpanan(),
    users: r.one.users({
      from: r.members.user_id,
      to: r.users.id,
    }),
  },
  rekeningSimpanan: {
    jenisSimpanan: r.one.jenisSimpanan({
      from: r.rekeningSimpanan.jenis_simpanan_id,
      to: r.jenisSimpanan.id,
    }),
    member: r.one.members({
      from: r.rekeningSimpanan.member_id,
      to: r.members.id,
    }),
  },
}));
