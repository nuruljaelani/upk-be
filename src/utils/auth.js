import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import bcrypt from "bcryptjs"

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(payload, ttl = env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ttl,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
