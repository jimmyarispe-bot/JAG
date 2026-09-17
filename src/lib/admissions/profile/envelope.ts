import { notFound } from "next/navigation";
import { canAccessAdmissionsCaseProfile } from "@/lib/admissions/profile/access";
import type { AdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import {
  pipelineStageLabel,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry";
import { buildProfileEnvelopeBase } from "@/lib/platform/profile/envelope";
import { extractSchoolOrganizationId } from "@/lib/platform/shared/context";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function buildAdmissionsCaseProfileEnvelope(
  supabase: AuthClient,
  caseId: string,
  identity: IdentityContext
): Promise<AdmissionsCaseProfileEnvelope | null> {
  const { data: lead } = await supabase
    .from("admissions_leads")
    .select(
      "id, school_id, first_name, last_name, preferred_name, lead_stage, stage_entered_at, guardian_email, guardian_phone, guardian_first_name, guardian_last_name, applying_for_grade, program, inquiry_date, schools(name, organization_id)"
    )
    .eq("id", caseId)
    .maybeSingle();

  if (!lead) return null;

  if (!(await canAccessAdmissionsCaseProfile(supabase, identity, lead))) {
    notFound();
  }

  const organizationId = extractSchoolOrganizationId(lead.schools);

  /*
     Preferred start date lives in the interest form's answers, not on the lead.
     A family who arrived by import or by hand has no answer and no date, which
     is a blank rather than a wrong date - the header simply omits the field.
  */
  const { data: startDateAnswer } = await supabase
    .from("admissions_interest_answers")
    .select("value, submission_id, admissions_interest_submissions!inner(lead_id)")
    .eq("question_key", "desired_start_date")
    .eq("admissions_interest_submissions.lead_id", lead.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rawStartDate = (startDateAnswer as { value?: unknown } | null)?.value;
  const desiredStartDate =
    typeof rawStartDate === "string" && rawStartDate.trim() ? rawStartDate.trim() : null;

  const guardianName =
    [lead.guardian_first_name, lead.guardian_last_name].filter(Boolean).join(" ") || null;
  const schoolName =
    (lead.schools as { name?: string } | null)?.name ?? null;
  const displayName = lead.preferred_name
    ? `${lead.preferred_name} ${lead.last_name}`
    : `${lead.first_name} ${lead.last_name}`;
  const pipelineStage = resolvePipelineStageFromLeadStage(lead.lead_stage);

  const base = await buildProfileEnvelopeBase(supabase, {
    profileKind: "admissions_case",
    entityType: "admissions_lead",
    entityId: lead.id,
    organizationId,
    schoolId: lead.school_id,
    displayName,
    subtitle: "Admissions Case",
    basePath: "/dashboard/admissions/cases",
    sectionParam: "section",
    defaultSection: "overview",
  });

  return {
    ...base,
    profileKind: "admissions_case",
    caseId: lead.id,
    leadId: lead.id,
    leadStage: lead.lead_stage,
    pipelineStage,
    pipelineStageLabel: pipelineStage ? pipelineStageLabel(pipelineStage) : lead.lead_stage,
    guardianEmail: lead.guardian_email,
    program: lead.program,
    inquiryDate: lead.inquiry_date,
    stageEnteredAt: lead.stage_entered_at,
    schoolName,
    applyingForGrade: lead.applying_for_grade,
    guardianName,
    guardianPhone: lead.guardian_phone,
    desiredStartDate,
  };
}
