/**
 * In-memory Evidence Catalog fallback gate.
 *
 * Production must never present process-local / fixture evidence as durable
 * documents. Fallback is allowed only under test, or explicit non-production
 * opt-in.
 */

export function isJagEvidenceMemoryFallbackEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.JAG_EVIDENCE_ALLOW_MEMORY_FALLBACK === "true") return true;
  return process.env.NODE_ENV === "test";
}
