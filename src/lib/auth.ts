import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  ensurePrimaryAdminUser,
  getAdminUserById,
  getAdminUserWithPasswordByEmail,
  getAdminUserWithPasswordById,
  listAdminUsers,
  updateAdminUserPassword,
} from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";

const cookieName = "timeline_admin_session";

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function isAdminConfigured() {
  ensurePrimaryAdminUser();
  return listAdminUsers().length > 0;
}

export async function createAdminSession(userId: string) {
  const issuedAt = String(Date.now());
  const payload = `${userId}.${issuedAt}`;
  const value = `${payload}.${sign(payload)}`;
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
  return Boolean(await getCurrentAdminUser());
}

export async function getCurrentAdminUser() {
  if (!isAdminConfigured()) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  if (!value) return null;

  const [userId, issuedAt, signature] = value.split(".");
  if (!userId || !issuedAt || !signature) return null;

  const payload = `${userId}.${issuedAt}`;
  const expected = sign(payload);
  const validSignature =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  const fresh = Date.now() - Number(issuedAt) < 1000 * 60 * 60 * 24 * 7;
  if (!validSignature || !fresh) return null;

  return getAdminUserById(userId) ?? null;
}

export function verifyAdminCredentials(email: string, password: string) {
  const user = getAdminUserWithPasswordByEmail(email.trim().toLowerCase());
  if (!user) return null;
  return verifyPassword(password, user.password_hash) ? user : null;
}

export function changeAdminPassword(userId: string, currentPassword: string, nextPassword: string) {
  const user = getAdminUserWithPasswordById(userId);
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return { ok: false, message: "Das aktuelle Passwort ist falsch." };
  }

  updateAdminUserPassword(userId, hashPassword(nextPassword));
  return { ok: true, message: "Passwort geändert." };
}
