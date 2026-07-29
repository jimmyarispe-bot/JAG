/**
 * JAG Platform roles — isolated from AcademyOS product roles.
 */

export const JAG_PLATFORM_ROLES = Object.freeze([
  "FOUNDER",
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
  "ORG_OWNER",
  "MARKETPLACE_PUBLISHER",
  "AUDITOR",
] as const);

export type JagPlatformRole = (typeof JAG_PLATFORM_ROLES)[number];

/** AcademyOS product roles — must never be treated as JAG platform roles. */
export const ACADEMYOS_PRODUCT_ROLES = Object.freeze([
  "Teacher",
  "Parent",
  "Student",
  "School Leader",
  "Executive Director",
] as const);

export type AcademyOsProductRole = (typeof ACADEMYOS_PRODUCT_ROLES)[number];

export function isJagPlatformRole(value: unknown): value is JagPlatformRole {
  return (
    typeof value === "string" &&
    (JAG_PLATFORM_ROLES as readonly string[]).includes(value)
  );
}

export function isAcademyOsProductRole(value: unknown): boolean {
  return (
    typeof value === "string" &&
    (ACADEMYOS_PRODUCT_ROLES as readonly string[]).includes(value)
  );
}

export function platformRolesOverlapAcademyOs(): boolean {
  const academy = new Set(
    ACADEMYOS_PRODUCT_ROLES.map((r) => r.toLowerCase().replace(/\s+/g, "_"))
  );
  return JAG_PLATFORM_ROLES.some((r) => academy.has(r.toLowerCase()));
}
