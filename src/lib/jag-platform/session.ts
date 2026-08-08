/**
 * JAG Platform session cookie — HMAC integrity-protected.
 * Separate from AcademyOS / Supabase auth cookies.
 * Edge-safe (Web Crypto) for middleware verification.
 *
 * Organization-bound: platform stewards may have null organizationId;
 * customer org operators must carry their bound organizationId.
 */

import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import { isJagPlatformRole } from "@/lib/jag-platform/roles";
import type { JagAuthorityKind } from "@/lib/platform/identity/jag-authority";
import { resolveJagSessionSigningSecret } from "@/lib/jag-platform/session-secret";

/** Versioned cookie name — legacy unsigned `jag_platform_session` is ignored. */
export const JAG_PLATFORM_SESSION_COOKIE = "jag_platform_session_v2" as const;

/** Previous unsigned cookie — cleared on logout so it cannot linger. */
export const JAG_PLATFORM_SESSION_COOKIE_LEGACY = "jag_platform_session" as const;

const SESSION_TOKEN_PREFIX = "v1" as const;

export const JAG_PLATFORM_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type JagPlatformSession = {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: JagPlatformRole;
  readonly issuedAt: string;
  /** Platform steward vs customer organization operator. */
  readonly authority: JagAuthorityKind;
  /**
   * Bound organization UUID.
   * Required for authority=organization; optional for platform stewards.
   */
  readonly organizationId: string | null;
  /**
   * Authoritative customer organization display name stamped at bind/rebind.
   * Survives in-memory provisioned/brand cache resets; never the generic fallback.
   */
  readonly organizationDisplayName?: string | null;
  /** Unix ms expiry — required on signed cookie tokens; optional for in-memory fixtures. */
  readonly exp?: number;
};

type SessionPayload = {
  userId: string;
  email: string;
  displayName: string;
  role: JagPlatformRole;
  issuedAt: string;
  authority: JagAuthorityKind;
  organizationId: string | null;
  organizationDisplayName?: string | null;
  exp: number;
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

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(view).toString("base64url");
  }
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacSign(secret: string, payloadB64: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  return bytesToBase64Url(sig);
}

function isAuthority(value: unknown): value is JagAuthorityKind {
  return value === "platform" || value === "organization";
}

function isValidPayload(parsed: Partial<SessionPayload>): parsed is SessionPayload {
  const displayOk =
    parsed.organizationDisplayName === undefined ||
    parsed.organizationDisplayName === null ||
    typeof parsed.organizationDisplayName === "string";
  return (
    typeof parsed.userId === "string" &&
    typeof parsed.email === "string" &&
    typeof parsed.displayName === "string" &&
    isJagPlatformRole(parsed.role) &&
    typeof parsed.issuedAt === "string" &&
    isAuthority(parsed.authority) &&
    (parsed.organizationId === null || typeof parsed.organizationId === "string") &&
    displayOk &&
    typeof parsed.exp === "number" &&
    Number.isFinite(parsed.exp) &&
    // Org operators must be organization-bound.
    !(parsed.authority === "organization" && !parsed.organizationId)
  );
}

/**
 * Build a signed session token. Fails closed when no signing secret is configured.
 */
export async function encodeJagPlatformSession(
  session: Omit<JagPlatformSession, "exp"> & { exp?: number },
  maxAgeSeconds = JAG_PLATFORM_SESSION_MAX_AGE_SECONDS
): Promise<string | null> {
  const secret = resolveJagSessionSigningSecret();
  if (!secret) return null;

  if (session.authority === "organization" && !session.organizationId) {
    return null;
  }

  const issuedAt = session.issuedAt || new Date().toISOString();
  const exp =
    typeof session.exp === "number"
      ? session.exp
      : Date.now() + maxAgeSeconds * 1000;

  const payload: SessionPayload = {
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
    role: session.role,
    issuedAt,
    authority: session.authority,
    organizationId: session.organizationId,
    ...(session.organizationDisplayName != null &&
    session.organizationDisplayName.trim()
      ? { organizationDisplayName: session.organizationDisplayName.trim() }
      : {}),
    exp,
  };

  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const sig = await hmacSign(secret, payloadB64);
  return `${SESSION_TOKEN_PREFIX}.${payloadB64}.${sig}`;
}

/**
 * Verify signature + expiry. Malformed, unsigned, tampered, or expired → null.
 */
export async function decodeJagPlatformSession(
  raw: string | undefined | null
): Promise<JagPlatformSession | null> {
  if (!raw) return null;
  const secret = resolveJagSessionSigningSecret();
  if (!secret) return null;

  try {
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const [prefix, payloadB64, sig] = parts;
    if (prefix !== SESSION_TOKEN_PREFIX || !payloadB64 || !sig) return null;

    const expected = await hmacSign(secret, payloadB64);
    if (!safeEqual(expected, sig)) return null;

    const parsed = JSON.parse(fromBase64Url(payloadB64)) as Partial<SessionPayload>;
    if (!isValidPayload(parsed)) return null;
    if (Date.now() > parsed.exp) return null;

    return {
      userId: parsed.userId,
      email: parsed.email,
      displayName: parsed.displayName,
      role: parsed.role,
      issuedAt: parsed.issuedAt,
      authority: parsed.authority,
      organizationId: parsed.organizationId,
      organizationDisplayName:
        typeof parsed.organizationDisplayName === "string" &&
        parsed.organizationDisplayName.trim()
          ? parsed.organizationDisplayName.trim()
          : null,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function jagPlatformSessionCookieOptions(
  maxAgeSeconds = JAG_PLATFORM_SESSION_MAX_AGE_SECONDS
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function hasJagPlatformSessionCookie(
  cookieValue: string | undefined
): Promise<boolean> {
  return (await decodeJagPlatformSession(cookieValue)) !== null;
}

/** Clear both v2 and legacy unsigned cookie names. */
export function clearJagPlatformSessionCookies(
  setCookie: (
    name: string,
    value: string,
    options: ReturnType<typeof jagPlatformSessionCookieOptions> & { maxAge: number }
  ) => void
): void {
  const cleared = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  setCookie(JAG_PLATFORM_SESSION_COOKIE, "", cleared);
  setCookie(JAG_PLATFORM_SESSION_COOKIE_LEGACY, "", cleared);
}
