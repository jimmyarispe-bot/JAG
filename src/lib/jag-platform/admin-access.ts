import { redirect } from "next/navigation";
import {
  JAG_PLATFORM_HOME_PATH,
  JAG_PLATFORM_LOGIN_PATH,
} from "@/lib/jag-platform/auth";
import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

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

/** Platform-admin / steward surfaces — not customer organization operators. */
export function canAccessJagPlatformAdmin(
  session: JagPlatformSession
): boolean {
  return session.authority === "platform";
}

/**
 * Require a signed-in platform steward for platform-only `/jag` pages.
 * Customers are redirected home (not elevated by URL).
 */
export async function requireJagPlatformAdminSession(): Promise<JagPlatformSession> {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }
  if (!canAccessJagPlatformAdmin(session)) {
    redirect(JAG_PLATFORM_HOME_PATH);
  }
  return session;
}
