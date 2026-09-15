import { redirect } from "next/navigation";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { authorize, toAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import type { PermissionKey } from "@/lib/platform/identity/types";

export async function requireSchoolLeaderExperienceContext() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login?next=/dashboard/school-leader");

  const snapshot = toAuthzSnapshot(ctx);
  const keys: PermissionKey[] = [
    "students.view",
    "school.configure",
    "admissions.view",
    "executive.dashboard",
    "scheduling.executive",
    "compliance.view",
    "hr.view",
    "finance.view",
  ];
  const allowed = keys.some((key) => authorize(snapshot, key));

  if (!allowed) redirect("/dashboard");

  const supabase = await createAuthClient();
  /**
   * Her campus, chosen deliberately rather than by row order.
   *
   * The primary assignment if there is one; otherwise the first, which is now
   * itself ordered (see loadOrgAssignmentsCached). Asking for the primary
   * EXPLICITLY here means this keeps working even if somebody adds an
   * unordered read upstream later — the thing that caused this.
   *
   * Heather Badger-Brown runs Academy Virtual and The Academy HS. Before this,
   * with four campuses on her account and no ordering anywhere, the page could
   * show her Florida.
   */
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ??
    ctx.orgAssignments[0]?.school_id ??
    null;
  const organizationId =
    schoolId ??
    ctx.accessibleSchoolIds[0] ??
    "default";

  return {
    identity: ctx,
    supabase,
    schoolId,
    organizationId,
    actorUserId: ctx.effectiveUserId,
  };
}
