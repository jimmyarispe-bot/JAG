/**
 * Constant-time string comparison for secrets (cron tokens, etc.).
 */

import { timingSafeEqual } from "crypto";

export function timingSafeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Compare Authorization header to `Bearer ${secret}`. */
export function authorizeBearerSecret(
  authorizationHeader: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !authorizationHeader) return false;
  const expected = `Bearer ${secret}`;
  return timingSafeStringEqual(authorizationHeader, expected);
}
