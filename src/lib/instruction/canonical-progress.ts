import { recordEvidence } from "@/lib/platform/evidence/record";
import type { EvidenceCaptureRole, RecordEvidenceInput } from "@/lib/platform/evidence/types";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { publishEvent } from "@/lib/platform/events/publisher/publish";
import { confirmCompetencyAdvance } from "@/lib/platform/paj/lifecycle/confirm-advance";
import {
  processJourneyEvidence,
  type ProcessJourneyEvidenceResult,
} from "@/lib/platform/paj/lifecycle/process-evidence";
import { getPajJourneyByStudent, listPajDomainEnrollments } from "@/lib/platform/paj/persistence/records";
import { PAJ_MASTERY_LEVELS, PAJ_SL_DOMAIN_KEY } from "@/lib/platform/paj/types";
import { syncStudentPlatformRelationships } from "@/lib/students/platform-sync";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface CanonicalLearningProgressInput {
  studentId: string;
  schoolId?: string | null;
  actorUserId?: string | null;
  sessionId?: string | null;
  evidenceTypeKey: string;
  competencyKeys?: string[];
  skillKeys?: string[];
  narrative?: string | null;
  artifactRefs?: RecordEvidenceInput["artifactRefs"];
  evidenceConfidence: number;
  evidenceQuality: number;
  sourceContext?: Record<string, unknown>;
  capturedByRole?: string;
  educatorConfirmAdvance?: boolean;
  domainKey?: string;
}

export interface CanonicalLearningProgressResult {
  evidenceId: string | null;
  pajResults: ProcessJourneyEvidenceResult[];
  advancedCompetencyKeys: string[];
  errors: string[];
}

/**
 * Authoritative learning progression path:
 * Teacher Session → KEE → PAJ → Competency Advancement → JAG Profile → Executive signal
 */
export async function processCanonicalLearningProgress(
  supabase: AuthClient,
  input: CanonicalLearningProgressInput
): Promise<CanonicalLearningProgressResult> {
  const errors: string[] = [];
  const pajResults: ProcessJourneyEvidenceResult[] = [];
  const advancedCompetencyKeys: string[] = [];

  const sourceContext = {
    ...(input.sourceContext ?? {}),
    sessionId: input.sessionId ?? input.sourceContext?.sessionId ?? null,
    canonicalPipeline: true,
  };

  const evidenceResult = await recordEvidence(supabase, {
    evidenceTypeKey: input.evidenceTypeKey,
    studentId: input.studentId,
    schoolId: input.schoolId ?? undefined,
    capturedByRole: (input.capturedByRole ?? "teacher") as EvidenceCaptureRole,
    capturedByUserId: input.actorUserId ?? undefined,
    competencyKeys: input.competencyKeys,
    skillKeys: input.skillKeys,
    artifactRefs: input.artifactRefs,
    narrative: input.narrative ?? undefined,
    evidenceConfidence: input.evidenceConfidence,
    evidenceQuality: input.evidenceQuality,
    sourceContext,
  });

  if (evidenceResult.error) {
    errors.push(evidenceResult.error);
    return { evidenceId: null, pajResults, advancedCompetencyKeys, errors };
  }

  const evidenceId = evidenceResult.id;
  if (!evidenceId) {
    return { evidenceId: null, pajResults, advancedCompetencyKeys, errors };
  }

  const journey = await getPajJourneyByStudent(supabase, input.studentId);
  let activeCompetencyKey: string | null = null;
  if (journey) {
    const enrollments = await listPajDomainEnrollments(supabase, journey.id);
    activeCompetencyKey =
      enrollments.find((enrollment) => enrollment.status === "active")?.active_competency_key ?? null;
  }
  const competencyKeys =
    input.competencyKeys?.length
      ? input.competencyKeys
      : activeCompetencyKey
        ? [activeCompetencyKey]
        : [];

  if (journey && competencyKeys.length > 0) {
    try {
      const results = await processJourneyEvidence(supabase, {
        journeyId: journey.id,
        evidenceId,
        studentId: input.studentId,
        competencyKeys,
        skillKeys: input.skillKeys,
        evidenceTypeKey: input.evidenceTypeKey,
        evidenceConfidence: input.evidenceConfidence,
        capturedByRole: input.capturedByRole ?? "teacher",
      });
      pajResults.push(...results);

      if (input.educatorConfirmAdvance && input.actorUserId) {
        for (const result of results) {
          if (
            result.masteryLevel >= PAJ_MASTERY_LEVELS.PROFICIENT &&
            result.bundleOk &&
            result.competencyKey === activeCompetencyKey
          ) {
            try {
              const advance = await confirmCompetencyAdvance(supabase, {
                journeyId: journey.id,
                competencyKey: result.competencyKey,
                educatorUserId: input.actorUserId,
                domainKey: input.domainKey ?? PAJ_SL_DOMAIN_KEY,
              });
              if (advance.advanced) {
                advancedCompetencyKeys.push(result.competencyKey);
              }
            } catch (err) {
              errors.push(
                err instanceof Error ? err.message : "Competency advance failed"
              );
            }
          }
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "PAJ evidence processing failed");
    }
  }

  try {
    await syncStudentPlatformRelationships(supabase, input.studentId);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "Profile sync failed");
  }

  await writePlatformAudit(supabase, {
    schoolId: input.schoolId ?? undefined,
    module: "learning_progress",
    entityType: "students",
    entityId: input.studentId,
    actionType: "canonical_learning_progress",
    summary: `Canonical learning progress: ${input.evidenceTypeKey}`,
    actorUserId: input.actorUserId ?? undefined,
    metadata: {
      evidenceId,
      competencyKeys,
      advancedCompetencyKeys,
      pajMasteryLevels: pajResults.map((r) => ({
        key: r.competencyKey,
        level: r.masteryLevel,
        bundleOk: r.bundleOk,
      })),
      errors: errors.length ? errors : undefined,
    },
  });

  await publishEvent(
    {
      eventType: "learning.progress.canonical_processed",
      entityType: "students",
      entityId: input.studentId,
      schoolId: input.schoolId ?? undefined,
      actorId: input.actorUserId ?? undefined,
      payload: {
        evidenceId,
        evidenceTypeKey: input.evidenceTypeKey,
        competencyKeys,
        advancedCompetencyKeys,
        sessionId: input.sessionId ?? null,
      },
    },
    { persist: { supabase }, recordAudit: true }
  );

  return { evidenceId, pajResults, advancedCompetencyKeys, errors };
}
