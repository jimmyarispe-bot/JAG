import { evaluateRuleSet } from "@/lib/platform/rules/engine/execute";
import { executeDecision } from "@/lib/platform/decision/engine/execute";
import type { PajCompetencyProgressRecord, PajRecommendationSnapshot } from "@/lib/platform/paj/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getStudentEvidenceRecords } from "@/lib/platform/evidence/query";
import type { PlatformEvidenceRecord } from "@/lib/platform/evidence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface EvaluateJourneyRecommendationsInput {
  supabase: AuthClient;
  studentId: string;
  schoolId?: string;
  organizationId?: string;
  activeCompetencyKey: string;
  competencyProgress: PajCompetencyProgressRecord[];
  actorUserId?: string;
}

/** Rules Engine + Decision Engine recommendations for active competency. */
export async function evaluateJourneyRecommendations(
  input: EvaluateJourneyRecommendationsInput
): Promise<PajRecommendationSnapshot> {
  const evidenceRecords: PlatformEvidenceRecord[] = await getStudentEvidenceRecords(
    input.supabase,
    input.studentId,
    { competencyKey: input.activeCompetencyKey, limit: 20 }
  );

  const activeProgress = input.competencyProgress.find(
    (p) => p.competency_key === input.activeCompetencyKey
  );
  const masteryLevel = activeProgress?.mastery_level ?? 0;

  const facts = {
    active_competency_key: input.activeCompetencyKey,
    mastery_level: masteryLevel,
    evidence_count: evidenceRecords.length,
    tier_signal: masteryLevel < 2 ? "intervention_candidate" : "on_track",
  };

  const ruleResult = await evaluateRuleSet(
    {
      ruleSetKey: "ref_student_placement",
      facts: {
        ...facts,
        studentId: input.studentId,
      },
      schoolId: input.schoolId,
      organizationId: input.organizationId,
      entityType: "learning_journey",
      entityId: input.studentId,
      actorUserId: input.actorUserId,
    },
    {
      persist: input.supabase ? { supabase: input.supabase } : undefined,
      evidenceRecords,
    }
  );

  let decisionExecutionId: string | undefined;
  let learningRecommendation: PajRecommendationSnapshot["learningRecommendation"];
  let interventionRecommendation: PajRecommendationSnapshot["interventionRecommendation"];

  try {
    const decisionResult = await executeDecision(
      {
        decisionType: "ref_platform_risk_signal",
        inputs: {
          ...facts,
          studentId: input.studentId,
        },
        schoolId: input.schoolId,
        organizationId: input.organizationId,
        entityType: "learning_journey",
        entityId: input.studentId,
        actorUserId: input.actorUserId,
      },
      { persist: input.supabase ? { supabase: input.supabase } : undefined }
    );
    decisionExecutionId = decisionResult.executionId;
    learningRecommendation = {
      outcomeKey: decisionResult.recommendation.outcomeKey,
      label: decisionResult.recommendation.label,
      score: decisionResult.recommendation.score,
    };
    if (masteryLevel < 2 && decisionResult.alternativeRecommendations[0]) {
      interventionRecommendation = {
        outcomeKey: decisionResult.alternativeRecommendations[0].outcomeKey,
        label: decisionResult.alternativeRecommendations[0].label,
        score: decisionResult.alternativeRecommendations[0].score,
      };
    }
  } catch {
    // Decision type may be unavailable in minimal catalog — rules result still valid
  }

  if (ruleResult.primaryOutcome) {
    interventionRecommendation ??= {
      outcomeKey: ruleResult.primaryOutcome.outcomeKey,
      label: ruleResult.primaryOutcome.label,
      score: ruleResult.primaryOutcome.score,
    };
  }

  return {
    learningRecommendation,
    interventionRecommendation,
    ruleEvaluationId: ruleResult.evaluationId,
    decisionExecutionId,
  };
}
