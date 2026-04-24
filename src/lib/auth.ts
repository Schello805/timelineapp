import crypto from "node:crypto";
import { cookies } from "next/headers";

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
  return email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
}
