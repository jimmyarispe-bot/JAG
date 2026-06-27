import type { AdmissionsPipelineStageKey } from "@/lib/admissions/registry";
import {
  getAllowedPipelineTransitions,
  pipelineStageLabel,
  resolveLegacyLeadStagesForPipelineStage,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry";
import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { transitionLeadStage } from "@/lib/admissions/workflow";
import type { LeadStageValue } from "@/lib/constants/admissions";
import { leadStageLabel } from "@/lib/constants/admissions";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface CaseWorkflowState {
  leadStage: string;
  pipelineStage: AdmissionsPipelineStageKey | null;
  pipelineStageLabel: string;
  allowedPipelineTransitions: AdmissionsPipelineStageKey[];
  legacyStageOptions: { value: string; label: string }[];
}

export interface CaseDerivedLink {
  id: string;
  relationshipType: string;
  label: string;
  href: string | null;
  entityType: string;
  entityId: string;
}

/** Resolve workflow state for an admissions case (lead row). */
export function getCaseWorkflowState(lead: { lead_stage: string }): CaseWorkflowState {
  const pipelineStage = resolvePipelineStageFromLeadStage(lead.lead_stage);
  return {
    leadStage: lead.lead_stage,
    pipelineStage,
    pipelineStageLabel: pipelineStage
      ? pipelineStageLabel(pipelineStage)
      : leadStageLabel(lead.lead_stage),
    allowedPipelineTransitions: pipelineStage ? getAllowedPipelineTransitions(pipelineStage) : [],
    legacyStageOptions: [{ value: lead.lead_stage, label: leadStageLabel(lead.lead_stage) }],
  };
}

/** Map an OS pipeline stage to the primary legacy lead_stage for DB writes. */
export function resolveLegacyStageForPipelineStage(
  pipelineStage: AdmissionsPipelineStageKey
): LeadStageValue | null {
  const legacy = resolveLegacyLeadStagesForPipelineStage(pipelineStage)[0];
  return (legacy as LeadStageValue) ?? null;
}

/** Record platform activity for a case stage transition. */
export async function recordCaseStageActivity(
  supabase: AuthClient,
  input: {
    leadId: string;
    schoolId: string;
    organizationId: string | null;
    previousStage: string;
    newStage: string;
    actorUserId: string | null;
  }
) {
  const fromPipeline = resolvePipelineStageFromLeadStage(input.previousStage);
  const toPipeline = resolvePipelineStageFromLeadStage(input.newStage);

  await recordActivity(supabase, {
    eventType: "admissions.stage_changed",
    entityType: "admissions_lead",
    entityId: input.leadId,
    schoolId: input.schoolId,
    organizationId: input.organizationId ?? undefined,
    actorUserId: input.actorUserId ?? undefined,
    title: "Pipeline stage changed",
    summary: `${leadStageLabel(input.previousStage)} → ${leadStageLabel(input.newStage)}`,
    payload: {
      previous_stage: input.previousStage,
      new_stage: input.newStage,
      previous_pipeline_stage: fromPipeline,
      new_pipeline_stage: toPipeline,
    },
    sourceTable: "admissions_lead_stage_history",
    sourceId: input.leadId,
    moduleKey: "admissions",
  });
}

/** Orchestrated case stage transition — legacy DB stage + platform activity. */
export async function transitionCaseStage(
  supabase: AuthClient,
  leadId: string,
  newStage: LeadStageValue,
  changedBy: string | null,
  context?: { schoolId?: string; organizationId?: string | null; tourScheduledAt?: string }
): Promise<{ error?: string; success?: boolean }> {
  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("lead_stage, school_id, schools(organization_id)")
    .eq("id", leadId)
    .single();

  if (!lead) return { error: "Case not found" };

  const previousStage = lead.lead_stage;
  const result = await transitionLeadStage(supabase, leadId, newStage, changedBy, {
    tourScheduledAt: context?.tourScheduledAt,
  });

  if (result.error || previousStage === newStage) return result;

  const schools = lead.schools as { organization_id?: string } | { organization_id?: string }[] | null;
  const orgId =
    context?.organizationId ??
    (Array.isArray(schools) ? schools[0]?.organization_id : schools?.organization_id) ??
    null;

  await recordCaseStageActivity(supabase, {
    leadId,
    schoolId: context?.schoolId ?? lead.school_id,
    organizationId: orgId,
    previousStage,
    newStage,
    actorUserId: changedBy,
  });

  return result;
}

/** Transition case by OS pipeline stage key (maps to legacy lead_stage). */
export async function transitionCasePipelineStage(
  supabase: AuthClient,
  leadId: string,
  pipelineStage: AdmissionsPipelineStageKey,
  changedBy: string | null
) {
  const legacyStage = resolveLegacyStageForPipelineStage(pipelineStage);
  if (!legacyStage) {
    return {
      error: `Pipeline stage "${pipelineStageLabel(pipelineStage)}" is not yet mapped to a legacy stage`,
    };
  }
  return transitionCaseStage(supabase, leadId, legacyStage, changedBy);
}

/** Derived relationship links from existing FKs — no duplicate entities. */
export async function getCaseDerivedRelationships(
  supabase: AuthClient,
  leadId: string
): Promise<CaseDerivedLink[]> {
  const links: CaseDerivedLink[] = [];

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("id, assigned_to_user_id, guardian_email, guardian_first_name, guardian_last_name")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return links;

  const [{ data: applications }, { data: students }] = await Promise.all([
    supabase.from("admissions_applications").select("id, application_status").eq("lead_id", leadId),
    supabase.from("students").select("id, first_name, last_name").eq("admissions_lead_id", leadId),
  ]);

  for (const app of applications ?? []) {
    links.push({
      id: `app-${app.id}`,
      relationshipType: "case.application",
      label: `Application (${app.application_status})`,
      href: `/apply/portal/${app.id}`,
      entityType: "admissions_application",
      entityId: app.id,
    });
  }

  if (lead.assigned_to_user_id) {
    links.push({
      id: `staff-${lead.assigned_to_user_id}`,
      relationshipType: "case.assigned_staff",
      label: "Assigned staff",
      href: null,
      entityType: "user",
      entityId: lead.assigned_to_user_id,
    });
  }

  if (lead.guardian_email) {
    links.push({
      id: `guardian-${leadId}`,
      relationshipType: "case.prospective_family",
      label: `${lead.guardian_first_name ?? ""} ${lead.guardian_last_name ?? ""}`.trim() ||
        lead.guardian_email,
      href: null,
      entityType: "prospective_family",
      entityId: leadId,
    });
  }

  for (const student of students ?? []) {
    links.push({
      id: `student-${student.id}`,
      relationshipType: "case.enrolled_student",
      label: `${student.first_name} ${student.last_name}`,
      href: `/dashboard/students/${student.id}`,
      entityType: "student",
      entityId: student.id,
    });
  }

  return links;
}
