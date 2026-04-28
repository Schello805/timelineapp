import crypto from "node:crypto";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const candidate = crypto.pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("hex");
  return hash.length === candidate.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}
