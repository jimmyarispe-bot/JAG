/**
 * Resolve the HMAC secret for JAG platform session cookies.
 * Reuses the same production-ready signing secret chain as OAuth state.
 *
 * Variable precedence (names only — never log values):
 *   OAUTH_STATE_SECRET → VAULT_ENCRYPTION_KEY → CRON_SECRET
 */

export function resolveJagSessionSigningSecret(): string | null {
  const secret =
    process.env.OAUTH_STATE_SECRET ||
    process.env.VAULT_ENCRYPTION_KEY ||
    process.env.CRON_SECRET;
  if (!secret || secret.trim().length === 0) return null;
  return secret;
}

export function requireJagSessionSigningSecret(): string {
  const secret = resolveJagSessionSigningSecret();
  if (!secret) {
    throw new Error(
      "JAG session signing requires OAUTH_STATE_SECRET, VAULT_ENCRYPTION_KEY, or CRON_SECRET"
    );
  }
  return secret;
}
