/**
 * HMAC-signed OAuth state — binds org + user and prevents CSRF / cross-org binding.
 *
 * Format: `<prefix>.<base64url(payload)>.<base64url(hmac)>`
 */

import { createHmac, timingSafeEqual } from "crypto";

export type OAuthStateClaims = {
  organizationId: string;
  userId: string;
  /** Expiry unix ms */
  exp: number;
  /** One-time nonce */
  n: string;
};

const DEFAULT_TTL_MS = 15 * 60 * 1000;

function stateSecret(): string {
  const secret =
    process.env.OAUTH_STATE_SECRET ||
    process.env.VAULT_ENCRYPTION_KEY ||
    process.env.CRON_SECRET;
  if (!secret) {
    throw new Error(
      "OAuth state signing requires OAUTH_STATE_SECRET, VAULT_ENCRYPTION_KEY, or CRON_SECRET"
    );
  }
  return secret;
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", stateSecret()).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createSignedOAuthState(
  prefix: string,
  input: { organizationId: string; userId: string },
  ttlMs = DEFAULT_TTL_MS
): string {
  const claims: OAuthStateClaims = {
    organizationId: input.organizationId,
    userId: input.userId,
    exp: Date.now() + ttlMs,
    n: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
  };
  const payloadB64 = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const sig = signPayload(payloadB64);
  return `${prefix}.${payloadB64}.${sig}`;
}

export function parseSignedOAuthState(
  prefix: string,
  state: string
): OAuthStateClaims | null {
  try {
    const parts = state.split(".");
    if (parts.length !== 3) return null;
    const [gotPrefix, payloadB64, sig] = parts;
    if (gotPrefix !== prefix || !payloadB64 || !sig) return null;
    if (!safeEqual(signPayload(payloadB64), sig)) return null;

    const claims = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as Partial<OAuthStateClaims>;

    if (
      typeof claims.organizationId !== "string" ||
      typeof claims.userId !== "string" ||
      typeof claims.exp !== "number" ||
      typeof claims.n !== "string"
    ) {
      return null;
    }
    if (Date.now() > claims.exp) return null;

    return {
      organizationId: claims.organizationId,
      userId: claims.userId,
      exp: claims.exp,
      n: claims.n,
    };
  } catch {
    return null;
  }
}
