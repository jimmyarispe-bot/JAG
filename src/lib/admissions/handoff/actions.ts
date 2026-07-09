"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/platform/activity";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import { resolveSchoolContext } from "@/lib/platform/shared/context";
import { completeEnrollmentHandoff } from "@/lib/admissions/handoff/complete-enrollment-handoff";

/** Staff-triggered completion of Admissions to Active Student™ after enrollment agreement. */
export async function completeEnrollmentHandoffAction(leadId: string, applicationId: string) {
  const auth = await assertAnyPermission("admissions.manage", "admissions.accept");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await completeEnrollmentHandoff(supabase, {
    leadId,
    applicationId,
    actorUserId: user?.id ?? null,
  });

  revalidatePath(`/dashboard/admissions/cases/${leadId}`);
  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
  revalidatePath("/dashboard/admissions");
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/teacher");

  if (!result.success) {
    return {
      error: result.error ?? result.activationError ?? "Enrollment handoff failed",
      studentId: result.studentId,
    };
  }

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("school_id")
    .eq("id", leadId)
    .maybeSingle();

  if (lead?.school_id) {
    const schoolCtx = await resolveSchoolContext(supabase, lead.school_id);
    await recordActivity(supabase, {
      eventType: "admissions.enrollment_completed",
      moduleKey: "admissions",
      entityType: "admissions_lead",
      entityId: leadId,
      title: "Enrollment completed",
      summary: result.studentId
        ? `Student ${result.studentId} activated from admissions`
        : "Enrollment handoff completed",
      organizationId: schoolCtx?.organizationId,
      schoolId: lead.school_id,
      studentId: result.studentId ?? null,
      actorUserId: user?.id ?? null,
      relatedEntityType: "admissions_application",
      relatedEntityId: applicationId,
      payload: {
        application_id: applicationId,
        student_id: result.studentId ?? null,
        family_id: result.conversion?.familyId ?? null,
      },
      sourceTable: "admissions_leads",
      sourceId: leadId,
    });
  }

  return { success: true, studentId: result.studentId };
}
