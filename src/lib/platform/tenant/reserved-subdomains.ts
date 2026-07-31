/**
 * Sprint 213 — Reserved subdomain names for *.thejag.org
 */

export const RESERVED_SUBDOMAINS = Object.freeze([
  "www",
  "app",
  "api",
  "admin",
  "mail",
  "smtp",
  "ftp",
  "status",
  "docs",
  "help",
  "support",
  "billing",
  "login",
  "auth",
  "cdn",
  "static",
  "assets",
  "thejag",
  "jag",
  "platform",
  "staging",
  "prod",
  "production",
  "test",
  "demo",
] as const);

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(
    subdomain.trim().toLowerCase() as (typeof RESERVED_SUBDOMAINS)[number]
  );
}
