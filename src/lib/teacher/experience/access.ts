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
    // employees has no organization_id and no name columns. Asking for them
    // made this select fail, which left employee null and organizationId
    // "default" for every teacher. Only real columns here.
    .select("id, school_id, user_id")
    .eq("id", employeeId)
    .maybeSingle();

  return {
    identity: ctx,
    supabase,
    employeeId,
    employee,
    organizationId:
      (employee as { school_id?: string } | null)?.school_id ??
      ctx.orgAssignments[0]?.school_id ??
      "default",
    actorUserId: ctx.effectiveUserId,
  };
}
