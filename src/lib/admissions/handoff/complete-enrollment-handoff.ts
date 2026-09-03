/**
 * Admissions to Active Student™ — end-to-end operational workflow.
 *
 * 1. Parent inquiry → portal/actions (submitPublicInquiry)
 * 2. Lead qualification → case profile + pipeline
 * 3. Admissions work queue → jag-work/resolve-admissions-work
 * 4. Interview scheduling → scheduleInterview / scheduleTour
 * 5. Application completion → portal/actions
 * 6. Document collection → portal + checklist
 * 7. Scholarship review → scholarships/actions + staff review
 * 8. School approval → decisions.ts (accept, no early SIS conversion)
 * 9. Enrollment agreement → enrollment-packets (sign triggers this handoff)
 * 10–16. Student creation + activation → conversion.ts + activation.ts
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { triggerCommunications } from "@/lib/admissions/communications/engine";
import { parseProgramValue } from "@/lib/constants/programs";
import {
  convertAcceptedApplicantToStudent,
  type ConversionResult,
} from "@/lib/sis/conversion";
import { activateStudentFromAdmissions } from "@/lib/sis/activation";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface CompleteEnrollmentHandoffInput {
  leadId: string;
  applicationId: string;
  actorUserId?: string | null;
}

export interface CompleteEnrollmentHandoffResult {
  success: boolean;
  conversion?: ConversionResult;
  studentId?: string;
  activationError?: string;
  loopErrors?: string[];
  error?: string;
  /** Enrolled, but nothing was billed — no tuition plan existed. */
  tuitionPlanMissing?: boolean;
}

/** Execute steps 9–16 after enrollment agreement is fully signed. */
export async function completeEnrollmentHandoff(
  supabase: AuthClient,
  input: CompleteEnrollmentHandoffInput
): Promise<CompleteEnrollmentHandoffResult> {
  const { leadId, applicationId, actorUserId = null } = input;

  const { data: application } = await supabase
    .from("admissions_applications")
    .select("id, application_status, school_year_id, lead_id")
    .eq("id", applicationId)
    .single();

  if (!application) return { success: false, error: "Application not found" };
  if (application.application_status !== "accepted") {
    return { success: false, error: "Application must be accepted before enrollment handoff" };
  }

  const { data: packet } = await supabase
    .from("enrollment_packets")
    .select("packet_status")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!packet || packet.packet_status !== "completed") {
    return { success: false, error: "Enrollment agreement must be fully signed" };
  }

  const conversion = await convertAcceptedApplicantToStudent(supabase, {
    applicationId,
    leadId,
    convertedBy: actorUserId,
    source: "decision",
  });

  if (!conversion.success) {
    return { success: false, error: conversion.error ?? "SIS conversion failed", conversion };
  }

  if (!conversion.studentId || !conversion.familyId) {
    return { success: false, error: "Conversion did not return student or family id", conversion };
  }

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select(
      "school_id, program, applying_for_grade, current_grade, guardian_email"
    )
    .eq("id", leadId)
    .single();

  if (!lead) return { success: false, error: "Lead not found", conversion };

  const activation = await activateStudentFromAdmissions(supabase, {
    studentId: conversion.studentId,
    familyId: conversion.familyId,
    leadId,
    applicationId,
    schoolId: lead.school_id,
    schoolYearId: application.school_year_id,
    program: parseProgramValue(lead.program),
    gradeLevel: lead.applying_for_grade ?? lead.current_grade,
    guardianEmail: lead.guardian_email,
    actorUserId,
  });

  if (!activation.success) {
    return {
      success: false,
      studentId: conversion.studentId,
      conversion,
      activationError: activation.error,
      error: activation.error,
    };
  }

  const stageResult = await transitionCaseStage(supabase, leadId, "enrolled", actorUserId);
  if (stageResult.error) {
    return {
      success: false,
      studentId: conversion.studentId,
      conversion,
      error: `Student activated but lead stage update failed: ${stageResult.error}`,
    };
  }

  await triggerCommunications(supabase, {
    leadId,
    applicationId,
    triggerEvent: "enrollment_completed",
    sentBy: actorUserId,
  });

  const { executeOperationalLoopTransitionChain } = await import(
    "@/lib/platform/operational-loop"
  );

  const loopResults = await executeOperationalLoopTransitionChain(supabase, [
    {
      transitionKey: "admissions_to_enrollment",
      studentId: conversion.studentId,
      schoolId: lead.school_id,
      actorUserId,
      relatedEntityType: "admissions_leads",
      relatedEntityId: leadId,
      metadata: { applicationId, source: "enrollment_handoff" },
    },
    {
      transitionKey: "enrollment_to_scheduling",
      studentId: conversion.studentId,
      schoolId: lead.school_id,
      actorUserId,
      facts: {
        courseSectionId: activation.courseSectionId,
        journeyId: activation.journeyId,
        invoiceId: activation.invoiceId,
      },
      metadata: { source: "activation" },
    },
    {
      transitionKey: "scheduling_to_instruction",
      studentId: conversion.studentId,
      schoolId: lead.school_id,
      actorUserId,
      metadata: { source: "post_activation" },
    },
    {
      transitionKey: "parent_communication_to_billing",
      studentId: conversion.studentId,
      schoolId: lead.school_id,
      actorUserId,
      facts: { invoiceId: activation.invoiceId },
      metadata: { source: "initial_billing" },
    },
  ]);

  const loopErrors = loopResults.filter((r) => !r.success).flatMap((r) => r.errors);
  if (loopErrors.length > 0) {
    return {
      success: false,
      studentId: conversion.studentId,
      conversion,
      loopErrors,
      error: `Enrollment activated but operational loop incomplete: ${loopErrors.join("; ")}`,
    };
  }

  return {
    success: true,
    studentId: conversion.studentId,
    conversion,
    tuitionPlanMissing: activation.tuitionPlanMissing ?? false,
  };
}
