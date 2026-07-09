import { getUlrCompetency, getUlrAtomicSkillsByCompetency } from "@/lib/platform/ulr/registry/registry";
import {
  canAdvanceFromCompetency,
  resolveNextCompetencyKey,
} from "@/lib/platform/paj/mastery";
import { publishPajEvent } from "@/lib/platform/paj/integration/events";
import { syncPajJourneyGraph } from "@/lib/platform/paj/integration/graph";
import { evaluatePrerequisitesMet } from "@/lib/platform/paj/progression";
import {
  getPajCompetencyProgress,
  getPajJourneyById,
  listPajCompetencyProgress,
  listPajDomainEnrollments,
  updatePajDomainActiveCompetency,
  upsertPajCompetencyProgress,
  upsertPajSkillProgress,
} from "@/lib/platform/paj/persistence/records";
import {
  PAJ_MASTERY_LEVELS,
  PAJ_SL_DOMAIN_KEY,
  type ConfirmCompetencyAdvanceInput,
} from "@/lib/platform/paj/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ConfirmCompetencyAdvanceResult {
  previousCompetencyKey: string;
  nextCompetencyKey: string | null;
  advanced: boolean;
}

/** Educator-confirmed advance to next ULR competency (PAJ-PA-1). */
export async function confirmCompetencyAdvance(
  supabase: AuthClient,
  input: ConfirmCompetencyAdvanceInput
): Promise<ConfirmCompetencyAdvanceResult> {
  const journey = await getPajJourneyById(supabase, input.journeyId);
  if (!journey) {
    throw new Error(`Journey not found: ${input.journeyId}`);
  }

  const domainKey = input.domainKey ?? PAJ_SL_DOMAIN_KEY;
  const progress = await getPajCompetencyProgress(
    supabase,
    input.journeyId,
    input.competencyKey
  );
  if (!progress) {
    throw new Error(`Competency progress not found: ${input.competencyKey}`);
  }

  const confirmedAt = new Date().toISOString();
  await upsertPajCompetencyProgress(supabase, {
    id: progress.id,
    journey_id: input.journeyId,
    domain_key: progress.domain_key,
    competency_key: input.competencyKey,
    mastery_level: progress.mastery_level,
    evidence_count: progress.evidence_count,
    evidence_type_keys: progress.evidence_type_keys,
    last_evidence_id: progress.last_evidence_id,
    educator_confirmed_at: confirmedAt,
    educator_confirmed_by: input.educatorUserId,
    status: progress.status,
    metadata: progress.metadata,
  });

  const gate = canAdvanceFromCompetency({
    masteryLevel: progress.mastery_level,
    educatorConfirmed: true,
  });
  if (!gate.ok) {
    throw new Error(gate.reason ?? "Advance gate failed");
  }

  const nextKey = resolveNextCompetencyKey(input.competencyKey);
  if (!nextKey) {
    await upsertPajCompetencyProgress(supabase, {
      id: progress.id,
      journey_id: input.journeyId,
      domain_key: progress.domain_key,
      competency_key: input.competencyKey,
      mastery_level: progress.mastery_level,
      evidence_count: progress.evidence_count,
      evidence_type_keys: progress.evidence_type_keys,
      last_evidence_id: progress.last_evidence_id,
      educator_confirmed_at: confirmedAt,
      educator_confirmed_by: input.educatorUserId,
      status: "proficient",
      metadata: progress.metadata,
    });
    return {
      previousCompetencyKey: input.competencyKey,
      nextCompetencyKey: null,
      advanced: false,
    };
  }

  const allProgress = await listPajCompetencyProgress(supabase, input.journeyId);
  const proficientKeys = new Set(
    allProgress
      .filter(
        (p) =>
          p.mastery_level >= PAJ_MASTERY_LEVELS.PROFICIENT ||
          p.competency_key === input.competencyKey
      )
      .map((p) => p.competency_key)
  );
  proficientKeys.add(input.competencyKey);

  const prereq = evaluatePrerequisitesMet(nextKey, proficientKeys);
  if (!prereq.ok) {
    throw new Error(
      `Prerequisites not met for ${nextKey}: missing ${prereq.missing.join(", ")}`
    );
  }

  await upsertPajCompetencyProgress(supabase, {
    id: progress.id,
    journey_id: input.journeyId,
    domain_key: progress.domain_key,
    competency_key: input.competencyKey,
    mastery_level: progress.mastery_level,
    evidence_count: progress.evidence_count,
    evidence_type_keys: progress.evidence_type_keys,
    last_evidence_id: progress.last_evidence_id,
    educator_confirmed_at: confirmedAt,
    educator_confirmed_by: input.educatorUserId,
    status: "proficient",
    metadata: progress.metadata,
  });

  const nextCompetency = getUlrCompetency(nextKey);
  if (!nextCompetency) {
    throw new Error(`Next competency not in ULR: ${nextKey}`);
  }

  await upsertPajCompetencyProgress(supabase, {
    journey_id: input.journeyId,
    domain_key: domainKey,
    competency_key: nextKey,
    mastery_level: PAJ_MASTERY_LEVELS.NOT_STARTED,
    evidence_count: 0,
    evidence_type_keys: [],
    last_evidence_id: null,
    educator_confirmed_at: null,
    educator_confirmed_by: null,
    status: "in_progress",
    metadata: {},
  });

  for (const skill of getUlrAtomicSkillsByCompetency(nextKey)) {
    await upsertPajSkillProgress(supabase, {
      journey_id: input.journeyId,
      competency_key: nextKey,
      skill_key: skill.skillKey,
      mastery_level: PAJ_MASTERY_LEVELS.NOT_STARTED,
      evidence_count: 0,
      last_evidence_id: null,
      status: "in_progress",
      metadata: {},
    });
  }

  const enrollments = await listPajDomainEnrollments(supabase, input.journeyId);
  const enrollment = enrollments.find((e) => e.domain_key === domainKey);
  if (enrollment) {
    await updatePajDomainActiveCompetency(supabase, enrollment.id, nextKey);
  }

  await publishPajEvent(supabase, {
    eventType: "learning.competency.advanced",
    journeyId: input.journeyId,
    studentId: journey.student_id,
    schoolId: journey.school_id ?? undefined,
    organizationId: journey.organization_id ?? undefined,
    actorUserId: input.educatorUserId,
    payload: {
      domainKey,
      previousCompetencyKey: input.competencyKey,
      nextCompetencyKey: nextKey,
    },
  });

  await syncPajJourneyGraph(supabase, {
    journeyId: input.journeyId,
    studentId: journey.student_id,
    domainKey,
    activeCompetencyKey: nextKey,
    schoolId: journey.school_id ?? undefined,
    organizationId: journey.organization_id ?? undefined,
  });

  return {
    previousCompetencyKey: input.competencyKey,
    nextCompetencyKey: nextKey,
    advanced: true,
  };
}
