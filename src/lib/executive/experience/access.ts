import { redirect } from "next/navigation";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { canAccessExecutiveIntelligence } from "@/lib/executive/access";
import { canViewEdi } from "@/lib/edi/access";

export async function requireExecutiveExperienceContext() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login?next=/dashboard/executive");

  if (!canAccessExecutiveIntelligence(ctx) && !canViewEdi(ctx)) {
    redirect("/dashboard");
  }

  const supabase = await createAuthClient();
  const schoolId = ctx.orgAssignments[0]?.school_id ?? null;
  const organizationId =
    schoolId ?? ctx.accessibleSchoolIds[0] ?? "default";

  return {
    identity: ctx,
    supabase,
    schoolId,
    organizationId,
    actorUserId: ctx.effectiveUserId,
  };
}
