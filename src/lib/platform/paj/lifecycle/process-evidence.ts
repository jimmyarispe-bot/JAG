import { getStudentEvidenceRecords } from "@/lib/platform/evidence/query";
import { evaluateEvidenceBundle } from "@/lib/platform/paj/mastery";
import { publishPajEvent } from "@/lib/platform/paj/integration/events";
import { syncPajMasteryGraphEdge } from "@/lib/platform/paj/integration/graph";
import {
  getPajCompetencyProgress,
  getPajJourneyById,
  upsertPajCompetencyProgress,
  upsertPajSkillProgress,
} from "@/lib/platform/paj/persistence/records";
import {
  PAJ_MASTERY_LEVELS,
  type PajMasteryLevel,
  type ProcessJourneyEvidenceInput,
} from "@/lib/platform/paj/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function skillLevelFromCount(count: number): PajMasteryLevel {
  if (count <= 0) return PAJ_MASTERY_LEVELS.NOT_STARTED;
  if (count === 1) return PAJ_MASTERY_LEVELS.EMERGING;
  if (count === 2) return PAJ_MASTERY_LEVELS.DEVELOPING;
  if (count >= 3) return PAJ_MASTERY_LEVELS.PROFICIENT;
  return PAJ_MASTERY_LEVELS.EMERGING;
}

export interface ProcessJourneyEvidenceResult {
  competencyKey: string;
  masteryLevel: PajMasteryLevel;
  bundleOk: boolean;
  bundleIssues: string[];
}

/** Process new KEE evidence against journey mastery state (Doc 3 · Doc 105). */
export async function processJourneyEvidence(
  supabase: AuthClient,
  input: ProcessJourneyEvidenceInput
): Promise<ProcessJourneyEvidenceResult[]> {
  const journey = await getPajJourneyById(supabase, input.journeyId);
  if (!journey) {
    throw new Error(`Journey not found: ${input.journeyId}`);
  }

  const results: ProcessJourneyEvidenceResult[] = [];

  for (const competencyKey of input.competencyKeys) {
    const existing = await getPajCompetencyProgress(supabase, input.journeyId, competencyKey);
    if (!existing) {
      throw new Error(`No competency progress for ${competencyKey} on journey ${input.journeyId}`);
    }

    const evidenceRecords = await getStudentEvidenceRecords(supabase, input.studentId, {
      competencyKey,
      limit: 50,
    });

    const bundle = evaluateEvidenceBundle(
      competencyKey,
      evidenceRecords.map((r) => ({
        evidence_type_key: r.evidence_type_key,
        evidence_confidence: r.evidence_confidence,
        captured_by_role: r.captured_by_role,
      }))
    );

    const evidenceTypeKeys = [...new Set(evidenceRecords.map((r) => r.evidence_type_key))];

    await upsertPajCompetencyProgress(supabase, {
      id: existing.id,
      journey_id: input.journeyId,
      domain_key: existing.domain_key,
      competency_key: competencyKey,
      mastery_level: bundle.suggestedLevel,
      evidence_count: evidenceRecords.length,
      evidence_type_keys: evidenceTypeKeys,
      last_evidence_id: input.evidenceId,
      educator_confirmed_at: existing.educator_confirmed_at,
      educator_confirmed_by: existing.educator_confirmed_by,
      status: bundle.suggestedLevel >= PAJ_MASTERY_LEVELS.PROFICIENT ? "review" : "in_progress",
      metadata: {
        ...existing.metadata,
        lastBundleEvaluation: {
          ok: bundle.ok,
          issues: bundle.issues,
          evaluatedAt: new Date().toISOString(),
        },
      },
    });

    if (input.skillKeys?.length) {
      for (const skillKey of input.skillKeys) {
        const skillCount =
          evidenceRecords.filter((r) => r.skill_keys.includes(skillKey)).length || 1;
        await upsertPajSkillProgress(supabase, {
          journey_id: input.journeyId,
          competency_key: competencyKey,
          skill_key: skillKey,
          mastery_level: skillLevelFromCount(skillCount),
          evidence_count: skillCount,
          last_evidence_id: input.evidenceId,
          status: skillCount >= 3 ? "review" : "in_progress",
          metadata: {},
        });
      }
    }

    await publishPajEvent(supabase, {
      eventType: "learning.mastery.updated",
      journeyId: input.journeyId,
      studentId: input.studentId,
      schoolId: journey.school_id ?? undefined,
      organizationId: journey.organization_id ?? undefined,
      payload: {
        competencyKey,
        masteryLevel: bundle.suggestedLevel,
        evidenceId: input.evidenceId,
        bundleOk: bundle.ok,
      },
    });

    await syncPajMasteryGraphEdge(supabase, {
      studentId: input.studentId,
      competencyKey,
      masteryLevel: bundle.suggestedLevel,
      schoolId: journey.school_id ?? undefined,
      organizationId: journey.organization_id ?? undefined,
    });

    results.push({
      competencyKey,
      masteryLevel: bundle.suggestedLevel,
      bundleOk: bundle.ok,
      bundleIssues: bundle.issues,
    });
  }

  return results;
}
