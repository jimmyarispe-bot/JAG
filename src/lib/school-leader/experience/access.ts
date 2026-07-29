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
  const schoolId = ctx.orgAssignments[0]?.school_id ?? null;
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
