import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getSetting, setSetting } from "@/lib/db";

const cookieName = "timeline_admin_session";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export async function createAdminSession() {
  const issuedAt = String(Date.now());
  const value = `${issuedAt}.${sign(issuedAt)}`;
  const cookieStore = await cookies();

  cookieStore.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) return false;

  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  if (!value) return false;

  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  const expected = sign(issuedAt);
  const validSignature =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  const fresh = Date.now() - Number(issuedAt) < 1000 * 60 * 60 * 24 * 7;

  return validSignature && fresh;
}

export function credentialsMatch(email: string, password: string) {
  if (email !== process.env.ADMIN_EMAIL) return false;

  const storedHash = getSetting("admin_password_hash")?.value;
  if (storedHash) {
    return verifyPassword(password, storedHash);
  }

  return password === process.env.ADMIN_PASSWORD;
}

export function changeAdminPassword(currentPassword: string, nextPassword: string) {
  if (!credentialsMatch(process.env.ADMIN_EMAIL ?? "", currentPassword)) {
    return { ok: false, message: "Das aktuelle Passwort ist falsch." };
  }

  setSetting("admin_password_hash", hashPassword(nextPassword));
  return { ok: true, message: "Passwort geändert." };
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const candidate = crypto.pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("hex");
  return hash.length === candidate.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}
