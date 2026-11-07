import { z } from "zod";

export const updateDeviceSchema = z.object({
  name: z.string().min(3, "Nama perangkat minimal 3 karakter").max(100).optional(),
  device_id: z
    .string()
    .min(3, "Device ID minimal 3 karakter")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Device ID hanya boleh huruf, angka, underscore, atau minus")
    .optional(),
  phone_number: z
    .string()
    .transform((val) => {
      if (!val) return "";
      return val.split("@")[0].split(":")[0];
    })
    .refine((val) => !val || /^(\+62|62|08)[0-9]{8,15}$/.test(val), {
      message: "Format nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789)",
    })
    .optional()
    .or(z.literal("")),
  api_url: z.string().url("Format API URL tidak valid").optional().or(z.literal("")),
  api_key: z.string().optional().or(z.literal("")),
  status: z.enum(["connected", "disconnected", "qr_ready", "connecting", "timeout"]).optional(),
});

export const simulatePairSchema = z.object({
  phone_number: z
    .string()
    .regex(/^(\+62|62|08)[0-9]{8,15}$/, "Format nomor WhatsApp tidak valid (contoh: 08123456789)")
    .optional(),
});
