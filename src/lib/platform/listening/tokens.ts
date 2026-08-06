/**
 * Opaque listening campaign token helpers.
 * Plaintext bearer is returned only at mint time; persist SHA-256 digest only.
 */

import { createHash, randomBytes } from "node:crypto";

const MIN_TOKEN_CHARS = 16;

/** Generate a cryptographically strong public campaign bearer (≥128 bits). */
export function mintListeningCampaignToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 digest as Buffer (matches Postgres bytea / digest()). */
export function hashListeningToken(token: string): Buffer {
  const normalized = token.trim();
  if (normalized.length < MIN_TOKEN_CHARS) {
    throw new Error("listening_token_invalid");
  }
  return createHash("sha256").update(normalized, "utf8").digest();
}

/** Hex encoding for Supabase bytea inserts when client expects hex `\x...`. */
export function hashListeningTokenHex(token: string): string {
  return `\\x${hashListeningToken(token).toString("hex")}`;
}

export function isListeningTokenShapeValid(token: unknown): token is string {
  return typeof token === "string" && token.trim().length >= MIN_TOKEN_CHARS;
}
