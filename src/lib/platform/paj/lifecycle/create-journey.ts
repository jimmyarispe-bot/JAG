import { getUlrCompetency, getUlrAtomicSkillsByCompetency } from "@/lib/platform/ulr/registry/registry";
import { publishPajEvent } from "@/lib/platform/paj/integration/events";
import { syncPajJourneyGraph } from "@/lib/platform/paj/integration/graph";
import { resolveSlPlacementCompetency } from "@/lib/platform/paj/progression";
import {
  getPajJourneyByStudent,
  insertPajDomainEnrollment,
  insertPajJourney,
  insertPajPlacement,
  upsertPajCompetencyProgress,
  upsertPajSkillProgress,
} from "@/lib/platform/paj/persistence/records";
import {
  PAJ_MASTERY_LEVELS,
  PAJ_SL_DOMAIN_KEY,
  PAJ_SL_PA_LIBRARY_KEY,
  PAJ_SL_PA_PATHWAY_KEY,
  type CreateLearningJourneyInput,
} from "@/lib/platform/paj/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface CreateLearningJourneyResult {
  journeyId: string;
  enrollmentId: string;
  placementId: string;
  placedCompetencyKey: string;
}

/** Initialize a Personal Learning Journey with Structured Literacy enrollment and placement. */
export async function createLearningJourney(
  supabase: AuthClient,
  input: CreateLearningJourneyInput
): Promise<CreateLearningJourneyResult> {
  const existing = await getPajJourneyByStudent(supabase, input.studentId);
  if (existing) {
    throw new Error(`Active learning journey already exists for student ${input.studentId}`);
  }

  const placedCompetencyKey = resolveSlPlacementCompetency(input);
  const competency = getUlrCompetency(placedCompetencyKey);
  if (!competency) {
    throw new Error(`ULR competency not found: ${placedCompetencyKey}`);
  }

  const journeyResult = await insertPajJourney(supabase, {
    student_id: input.studentId,
    organization_id: input.organizationId ?? null,
    school_id: input.schoolId ?? null,
    program_track: input.programTrack ?? "virtual",
    status: "active",
    metadata: { engineVersion: "1.0.0", initialDomain: PAJ_SL_DOMAIN_KEY },
  });
  if (!journeyResult.id) {
    throw new Error(journeyResult.error ?? "Failed to create journey");
  }

  const journeyId = journeyResult.id;

  const enrollmentResult = await insertPajDomainEnrollment(supabase, {
    journey_id: journeyId,
    domain_key: PAJ_SL_DOMAIN_KEY,
    pathway_key: PAJ_SL_PA_PATHWAY_KEY,
    library_key: PAJ_SL_PA_LIBRARY_KEY,
    status: "active",
    active_competency_key: placedCompetencyKey,
    metadata: {},
  });
  if (!enrollmentResult.id) {
    throw new Error(enrollmentResult.error ?? "Failed to create domain enrollment");
  }

  const reviewDate = new Date();
  reviewDate.setDate(reviewDate.getDate() + 90);

  const placementResult = await insertPajPlacement(supabase, {
    journey_id: journeyId,
    domain_key: PAJ_SL_DOMAIN_KEY,
    recommended_competency_key: placedCompetencyKey,
    placed_competency_key: placedCompetencyKey,
    placement_evidence_ids: input.placementEvidenceIds ?? [],
    placed_by_user_id: input.actorUserId ?? null,
    review_date: reviewDate.toISOString(),
    metadata: { placementMethod: "default_entry" },
  });
  if (!placementResult.id) {
    throw new Error(placementResult.error ?? "Failed to record placement");
  }

  await upsertPajCompetencyProgress(supabase, {
    journey_id: journeyId,
    domain_key: PAJ_SL_DOMAIN_KEY,
    competency_key: placedCompetencyKey,
    mastery_level: PAJ_MASTERY_LEVELS.NOT_STARTED,
    evidence_count: 0,
    evidence_type_keys: [],
    last_evidence_id: null,
    educator_confirmed_at: null,
    educator_confirmed_by: null,
    status: "in_progress",
    metadata: {},
  });

  for (const skill of getUlrAtomicSkillsByCompetency(placedCompetencyKey)) {
    await upsertPajSkillProgress(supabase, {
      journey_id: journeyId,
      competency_key: placedCompetencyKey,
      skill_key: skill.skillKey,
      mastery_level: PAJ_MASTERY_LEVELS.NOT_STARTED,
      evidence_count: 0,
      last_evidence_id: null,
      status: "in_progress",
      metadata: {},
    });
  }

  await publishPajEvent(supabase, {
    eventType: "learning.journey.created",
    journeyId,
    studentId: input.studentId,
    schoolId: input.schoolId,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    payload: { domainKey: PAJ_SL_DOMAIN_KEY, programTrack: input.programTrack ?? "virtual" },
  });

  await publishPajEvent(supabase, {
    eventType: "learning.placement.completed",
    journeyId,
    studentId: input.studentId,
    schoolId: input.schoolId,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    payload: {
      domainKey: PAJ_SL_DOMAIN_KEY,
      placedCompetencyKey,
      placementId: placementResult.id,
    },
  });

  await publishPajEvent(supabase, {
    eventType: "learning.competency.assigned",
    journeyId,
    studentId: input.studentId,
    schoolId: input.schoolId,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    payload: { domainKey: PAJ_SL_DOMAIN_KEY, competencyKey: placedCompetencyKey },
  });

  await syncPajJourneyGraph(supabase, {
    journeyId,
    studentId: input.studentId,
    domainKey: PAJ_SL_DOMAIN_KEY,
    activeCompetencyKey: placedCompetencyKey,
    schoolId: input.schoolId,
    organizationId: input.organizationId,
  });

  return {
    journeyId,
    enrollmentId: enrollmentResult.id,
    placementId: placementResult.id,
    placedCompetencyKey,
  };
}
