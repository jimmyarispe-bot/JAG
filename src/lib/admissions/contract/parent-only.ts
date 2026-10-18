import type { SessionUser } from "@/lib/auth/session";

/**
 * A PARENT SEES THE CONTRACT AND NOTHING ELSE - FOR NOW.
 *
 * Jimmy, 18 October 2026: "parents should only get access to this related
 * information when/if they receive a login to the jag. no other
 * functions/areas/page until i say so."
 *
 * A parent-only account (every role it holds is PARENT) is sent to /contract
 * from the two older parent areas, /portal and /apply/portal. Staff who also
 * hold a parent role are not parent-only and are left alone.
 *
 * To open the rest to parents later, this is the one switch: return false.
 */
export function isParentOnly(session: Pick<SessionUser, "roles"> | null): boolean {
  if (!session) return false;
  const roles = session.roles ?? [];
  return roles.length > 0 && roles.every((role) => role === "PARENT");
}

export const PARENT_HOME = "/contract";
