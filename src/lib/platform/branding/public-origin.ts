/**
 * Public application origin for metadata, auth links, and OAuth callbacks.
 * Never fall back to localhost in production / Vercel production.
 */

import { CANONICAL_JAG_PRODUCTION_ORIGIN } from "./types";

/**
 * Resolve the public app origin (no trailing slash).
 *
 * Order: NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_SITE_URL →
 * production canonical → Vercel preview URL → local development.
 */
export function resolvePublicAppOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_JAG_PRODUCTION_ORIGIN;
  }

  // Bare NODE_ENV=production without explicit Vercel preview → canonical.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview" &&
    process.env.VERCEL_ENV !== "development"
  ) {
    return CANONICAL_JAG_PRODUCTION_ORIGIN;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (host) return `https://${host}`;
  }

  return "http://localhost:3000";
}
