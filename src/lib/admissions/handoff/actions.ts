"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/platform/activity";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import { resolveSchoolContext } from "@/lib/platform/shared/context";
import { completeEnrollmentHandoff } from "@/lib/admissions/handoff/complete-enrollment-handoff";
import { convertAcceptedApplicantByLead } from "@/lib/sis/conversion";

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
/**
 * Convert a lead straight to a student record, without the enrollment handoff.
 *
 * THIS IS DELIBERATELY LESS THAN completeEnrollmentHandoffAction.
 * It creates the student, the family, the guardian and the enrolment, and it
 * records the conversion. It does NOT activate the student, does NOT create a
 * tuition plan, does NOT bill, and does NOT invite the parent to the portal.
 *
 * It exists because, measured on 20 September 2026, the handoff required an
 * accepted admissions_application and a completed enrollment_packet, and the
 * JAG holds zero of both. Every student on the roster arrived by a route that
 * recorded nothing. This closes the gap in the roster without deciding
 * anything about money or signed agreements.
 *
 * When a student with this child's name already exists in the school,
 * convertAcceptedApplicantByLead LINKS to that student instead of creating a
 * second one, and refuses outright when more than one name matches.
 */
export async function convertLeadToStudentAction(leadId: string) {
  const auth = await assertAnyPermission("admissions.manage", "admissions.accept");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await convertAcceptedApplicantByLead(supabase, leadId, user?.id ?? null, "manual");

  revalidatePath(`/dashboard/admissions/cases/${leadId}`);
  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
  revalidatePath("/dashboard/admissions");
  revalidatePath("/dashboard/students");

  if (!result.success) {
    return { error: result.error ?? "Conversion failed" };
  }

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("school_id, first_name, last_name")
    .eq("id", leadId)
    .maybeSingle();

  if (lead?.school_id) {
    const schoolCtx = await resolveSchoolContext(supabase, lead.school_id);
    await recordActivity(supabase, {
      eventType: "admissions.lead_converted",
      moduleKey: "admissions",
      entityType: "admissions_lead",
      entityId: leadId,
      title: result.alreadyExists ? "Lead linked to existing student" : "Lead converted to student",
      summary: result.alreadyExists
        ? `${lead.first_name} ${lead.last_name} was already on the roster; the lead is now linked to that student.`
        : `${lead.first_name} ${lead.last_name} became a student record. Not activated, not billed.`,
      organizationId: schoolCtx?.organizationId,
      schoolId: lead.school_id,
      studentId: result.studentId ?? null,
      actorUserId: user?.id ?? null,
      payload: {
        student_id: result.studentId ?? null,
        family_id: result.familyId ?? null,
        conversion_id: result.conversionId ?? null,
        already_existed: result.alreadyExists ?? false,
        activated: false,
        billed: false,
      },
      sourceTable: "admissions_leads",
      sourceId: leadId,
    });
  }

  return {
    success: true,
    studentId: result.studentId,
    familyId: result.familyId ?? null,
    alreadyExisted: result.alreadyExists ?? false,
  };
}
