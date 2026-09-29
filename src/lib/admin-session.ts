import type { NextRequest } from "next/server";

/**
 * Admin sessions. Signing in (POST /api/admin/auth) sets an httpOnly cookie
 * holding "<expiry>.<signature>", an HMAC of the expiry keyed by
 * ADMIN_SESSION_SECRET (or ADMIN_PASSWORD when that isn't set), so changing
 * the password signs everyone out. src/proxy.ts checks it on every admin API
 * request. Scripts can use `Authorization: Bearer <ADMIN_API_TOKEN>` instead.
 *
 * Web Crypto only, so this runs the same in the proxy and in route handlers.
 */

export const ADMIN_COOKIE = "craefto_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();

function sessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || undefined;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message))));
}

/** Constant-time comparison: both sides are hashed first, so length leaks nothing. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all(
    [a, b].map(async (value) => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))))
  );
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function createAdminSession(): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const expires = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  return `${expires}.${await sign(`craefto-admin:${expires}`, secret)}`;
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [expires, signature] = token.split(".");
  if (!signature || !/^\d+$/.test(expires) || Number(expires) * 1000 < Date.now()) return false;
  return safeEqual(signature, await sign(`craefto-admin:${expires}`, secret));
}

/** A signed-in admin browser, or a script holding the API token. */
export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const apiToken = process.env.ADMIN_API_TOKEN;
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (apiToken && bearer && (await safeEqual(bearer, apiToken))) return true;
  return verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}
