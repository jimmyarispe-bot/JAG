/**
 * Learning Center authorization — session-derived only.
 * Never trust client-provided role, persona, userId, or organizationId.
 */

import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { FeatureFlagService } from "@/lib/platform/tenant/FeatureFlagService";
import type { JagLearnTutorial } from "./types";

/** Parent/Student are AcademyOS product roles — not JAG platform access. */
const BLOCKED_PRODUCT_ROLE_HINTS = new Set([
  "parent",
  "student",
  "guardian",
]);

export function canAccessJagLearningCenter(
  session: JagPlatformSession | null
): boolean {
  if (!session?.userId) return false;
  // Platform roles are already filtered at JAG login; reject accidental product roles.
  if (BLOCKED_PRODUCT_ROLE_HINTS.has(session.role.toLowerCase())) return false;
  return true;
}

/**
 * Capability gate for a tutorial.
 * Platform stewards without an org may view orientation + all essentials for product literacy.
 * Organization operators require the capability flag on their active org.
 */
export function canAccessTutorial(
  session: JagPlatformSession,
  tutorial: JagLearnTutorial,
  activeOrganizationId: string | null
): boolean {
  if (!canAccessJagLearningCenter(session)) return false;
  if (!tutorial.isActive) return false;
  if (!tutorial.requiredCapabilityId) return true;

  if (session.authority === "platform" && !activeOrganizationId) {
    return true;
  }

  const orgId =
    activeOrganizationId?.trim() || session.organizationId?.trim() || "";
  if (!orgId) return false;

  return FeatureFlagService.isEnabled(orgId, tutorial.requiredCapabilityId);
}

export function filterAccessibleTutorials(
  session: JagPlatformSession,
  tutorials: readonly JagLearnTutorial[],
  activeOrganizationId: string | null
): JagLearnTutorial[] {
  return tutorials.filter((t) =>
    canAccessTutorial(session, t, activeOrganizationId)
  );
}

/** Recommendations: orientation first, then essentials the user can access. */
export function recommendTutorials(
  session: JagPlatformSession,
  tutorials: readonly JagLearnTutorial[],
  activeOrganizationId: string | null,
  limit = 4
): JagLearnTutorial[] {
  const accessible = filterAccessibleTutorials(
    session,
    tutorials,
    activeOrganizationId
  );
  const orientation = accessible.filter((t) => t.category === "orientation");
  const essentials = accessible.filter((t) => t.category === "essentials");
  return [...orientation, ...essentials].slice(0, limit);
}
