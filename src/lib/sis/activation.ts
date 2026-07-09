import type { createAuthClient } from "@/lib/supabase/server-auth";
import { generateTuitionInvoiceFromPlan } from "@/lib/finance/tuition-engine";
import { createLearningJourney } from "@/lib/platform/paj/lifecycle/create-journey";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import {
  syncGuardianStudentRelationships,
  syncStudentPlatformRelationships,
} from "@/lib/students/platform-sync";
import { syncInstructionalTeamFromRoster } from "@/lib/instruction/growth-plan";
import { enrollStudentInBestSection } from "@/lib/scheduling/placement";
import { transitionStudentLifecycle } from "@/lib/ssis/transitions";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ActivateStudentFromAdmissionsInput {
  studentId: string;
  familyId: string;
  leadId: string;
  applicationId: string;
  schoolId: string;
  schoolYearId: string;
  program: string | null;
  gradeLevel: string | null;
  guardianEmail: string | null;
  actorUserId?: string | null;
}

export interface ActivateStudentResult {
  success: boolean;
  billingAccountId?: string;
  invoiceId?: string;
  journeyId?: string;
  courseSectionId?: string | null;
  assessmentInterviewId?: string | null;
  error?: string;
}

/** Steps 11–16: family activation, teacher roster, PAJ, assessment, finance, teacher workspace visibility. */
export async function activateStudentFromAdmissions(
  supabase: AuthClient,
  input: ActivateStudentFromAdmissionsInput
): Promise<ActivateStudentResult> {
  try {
    await syncStudentPlatformRelationships(supabase, input.studentId);

    const { data: school } = await supabase
      .from("schools")
      .select("organization_id")
      .eq("id", input.schoolId)
      .maybeSingle();

    await activateFamilyPortalAccess(supabase, input);
    const billingAccountId = await provisionFamilyBillingAccount(supabase, input);
    const invoiceId = await activateTuitionBilling(supabase, {
      ...input,
      billingAccountId,
    });

    let journeyId: string | undefined;
    try {
      const journey = await createLearningJourney(supabase, {
        studentId: input.studentId,
        organizationId: school?.organization_id ?? undefined,
        schoolId: input.schoolId,
        programTrack: input.program?.includes("hs") ? "hs" : "virtual",
        actorUserId: input.actorUserId ?? undefined,
      });
      journeyId = journey.journeyId;
    } catch (err) {
      if (!(err instanceof Error && err.message.includes("already exists"))) {
        throw err;
      }
    }

    const { courseSectionId } = await enrollStudentInBestSection(supabase, {
      studentId: input.studentId,
      schoolId: input.schoolId,
      schoolYearId: input.schoolYearId,
      program: input.program,
    });
    await syncInstructionalTeamFromRoster(supabase, input.studentId, input.schoolId);

    const assessmentInterviewId = await scheduleInitialAssessment(supabase, input);

    await transitionStudentLifecycle(supabase, {
      studentId: input.studentId,
      toStage: "active",
      triggerSource: "admissions",
      triggeredBy: input.actorUserId ?? null,
      notes: "Admissions to Active Student workflow completed",
      metadata: { leadId: input.leadId, applicationId: input.applicationId },
    });

    await supabase
      .from("admissions_leads")
      .update({ lead_stage: "enrolled" })
      .eq("id", input.leadId);

    await writePlatformAudit(supabase, {
      schoolId: input.schoolId,
      module: "admissions",
      actionType: "admissions_to_active_student",
      summary: "Student activated for instruction, billing, and family portal",
      entityType: "student",
      entityId: input.studentId,
      actorUserId: input.actorUserId,
      metadata: {
        leadId: input.leadId,
        applicationId: input.applicationId,
        courseSectionId,
        journeyId,
        assessmentInterviewId,
        invoiceId,
      },
    });

    return {
      success: true,
      billingAccountId,
      invoiceId,
      journeyId,
      courseSectionId,
      assessmentInterviewId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Activation failed",
    };
  }
}

async function activateFamilyPortalAccess(
  supabase: AuthClient,
  input: ActivateStudentFromAdmissionsInput
) {
  const { data: guardians } = await supabase
    .from("guardians")
    .select("id, email, is_primary")
    .eq("family_id", input.familyId);

  const emails = new Set<string>();
  if (input.guardianEmail) emails.add(input.guardianEmail.toLowerCase());
  for (const g of guardians ?? []) {
    if (g.email) emails.add(g.email.toLowerCase());
  }

  for (const email of emails) {
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (!userRow) continue;

    await supabase
      .from("guardians")
      .update({ user_id: userRow.id })
      .eq("family_id", input.familyId)
      .ilike("email", email);

    const primaryGuardian = (guardians ?? []).find((g) => g.email?.toLowerCase() === email);
    if (primaryGuardian) {
      await syncGuardianStudentRelationships(supabase, primaryGuardian.id, input.familyId);
    }

    const { data: existingLink } = await supabase
      .from("student_family_link")
      .select("id")
      .eq("student_id", input.studentId)
      .eq("user_id", userRow.id)
      .maybeSingle();

    if (!existingLink) {
      await supabase.from("student_family_link").insert({
        student_id: input.studentId,
        user_id: userRow.id,
        relationship_type: "parent",
      });
    }
  }
}

async function provisionFamilyBillingAccount(
  supabase: AuthClient,
  input: ActivateStudentFromAdmissionsInput
): Promise<string> {
  return provisionFamilyBillingAccountOnly(supabase, {
    familyId: input.familyId,
    schoolId: input.schoolId,
  });
}

async function activateTuitionBilling(
  supabase: AuthClient,
  input: ActivateStudentFromAdmissionsInput & { billingAccountId: string }
): Promise<string | undefined> {
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("student_id", input.studentId)
    .limit(1)
    .maybeSingle();

  if (existingInvoice) return existingInvoice.id;

  let planQuery = supabase
    .from("tuition_plans")
    .select("id, name")
    .eq("school_id", input.schoolId)
    .eq("status", "active");

  if (input.program) {
    planQuery = planQuery.eq("program", input.program);
  }

  let { data: plan } = await planQuery.order("created_at").limit(1).maybeSingle();

  if (!plan) {
    const { data: fallbackPlan } = await supabase
      .from("tuition_plans")
      .select("id, name")
      .eq("school_id", input.schoolId)
      .eq("status", "active")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    plan = fallbackPlan;
  }

  if (!plan) return undefined;

  const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]!;
  const invoiceNumber = `ENR-${input.studentId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const { invoiceId } = await generateTuitionInvoiceFromPlan(supabase, {
    billingAccountId: input.billingAccountId,
    studentId: input.studentId,
    tuitionPlanId: plan.id,
    invoiceNumber,
    dueDate,
    description: `Initial tuition — ${plan.name}`,
  });

  return invoiceId;
}

/** Provision billing account — callable from admissions automation. */
export async function provisionFamilyBillingAccountOnly(
  supabase: AuthClient,
  input: { familyId: string; schoolId: string }
) {
  const { data: existing } = await supabase
    .from("family_billing_accounts")
    .select("id")
    .eq("family_id", input.familyId)
    .eq("school_id", input.schoolId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("family_billing_accounts")
    .insert({
      family_id: input.familyId,
      school_id: input.schoolId,
      account_status: "active",
      balance: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}

async function scheduleInitialAssessment(
  supabase: AuthClient,
  input: ActivateStudentFromAdmissionsInput
): Promise<string | null> {
  const scheduledAt = new Date(Date.now() + 7 * 86400000).toISOString();

  const { data: existing } = await supabase
    .from("admissions_interviews")
    .select("id")
    .eq("lead_id", input.leadId)
    .eq("interview_type", "initial_assessment")
    .maybeSingle();

  if (existing) return existing.id;

  const { data: interview, error } = await supabase
    .from("admissions_interviews")
    .insert({
      lead_id: input.leadId,
      application_id: input.applicationId,
      scheduled_at: scheduledAt,
      interview_type: "initial_assessment",
      notes: "Initial assessment scheduled by Admissions to Active Student workflow",
      host_user_id: input.actorUserId ?? null,
    })
    .select("id")
    .single();

  if (error) return null;
  return interview.id;
}
