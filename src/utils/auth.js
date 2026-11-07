import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export async function hashPassword(password) {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

export async function verifyPassword(password, hash) {
  return await Bun.password.verify(password, hash);
}

export function generateToken(payload, ttl = env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ttl,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
