import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

/** Roles that may view the internal Platform Health dashboard. */
export const PLATFORM_HEALTH_ROLES: readonly JagPlatformRole[] = Object.freeze([
  "FOUNDER",
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
  "AUDITOR",
]);

export function canViewPlatformHealth(session: JagPlatformSession): boolean {
  return PLATFORM_HEALTH_ROLES.includes(session.role);
}
