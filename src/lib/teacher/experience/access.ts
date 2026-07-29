import { redirect } from "next/navigation";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getTeacherEmployeeId } from "@/lib/teacher/queries";

export async function requireTeacherExperienceContext() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login?next=/dashboard/teacher");

  const supabase = await createAuthClient();
  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);
  if (!employeeId) {
    redirect("/dashboard/teacher");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id, school_id, organization_id, display_name, first_name, last_name")
    .eq("id", employeeId)
    .maybeSingle();

  return {
    identity: ctx,
    supabase,
    employeeId,
    employee,
    organizationId:
      (employee as { organization_id?: string } | null)?.organization_id ??
      (employee as { school_id?: string } | null)?.school_id ??
      "default",
    actorUserId: ctx.effectiveUserId,
  };
}
