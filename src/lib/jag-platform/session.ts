/**
 * JAG Platform session cookie — separate from AcademyOS / Supabase auth.
 * Edge-safe encoding (middleware + Node).
 */

import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import { isJagPlatformRole } from "@/lib/jag-platform/roles";

export const JAG_PLATFORM_SESSION_COOKIE = "jag_platform_session" as const;

export type JagPlatformSession = {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: JagPlatformRole;
  readonly issuedAt: string;
};

function toBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(raw: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw, "base64url").toString("utf8");
  }
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeJagPlatformSession(session: JagPlatformSession): string {
  return toBase64Url(JSON.stringify(session));
}

export function decodeJagPlatformSession(
  raw: string | undefined | null
): JagPlatformSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as Partial<JagPlatformSession>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.displayName !== "string" ||
      !isJagPlatformRole(parsed.role) ||
      typeof parsed.issuedAt !== "string"
    ) {
      return null;
    }
    return {
      userId: parsed.userId,
      email: parsed.email,
      displayName: parsed.displayName,
      role: parsed.role,
      issuedAt: parsed.issuedAt,
    };
  } catch {
    return null;
  }
}

export function jagPlatformSessionCookieOptions(maxAgeSeconds = 60 * 60 * 12) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function hasJagPlatformSessionCookie(
  cookieValue: string | undefined
): boolean {
  return decodeJagPlatformSession(cookieValue) !== null;
}
