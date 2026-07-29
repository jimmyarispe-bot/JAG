/**
 * Parent learning summaries — orchestrates portal progress + LearningIntelligence.
 * Does not recreate mastery models.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getStudentProgressCenter } from "@/lib/portal/progress";
import { createLearningIntelligenceEngine } from "@learning-intelligence";
import { publishParentExperienceEvent } from "./events";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getParentLearningSummary(
  supabase: AuthClient,
  studentId: string,
  opts?: { organizationId?: string | null; actorUserId?: string | null }
) {
  const progress = await getStudentProgressCenter(supabase, studentId);

  let liMastery: unknown[] = [];
  let liError: string | null = null;
  try {
    const li = createLearningIntelligenceEngine();
    if (opts?.organizationId) {
      liMastery = [...li.listMastery(opts.organizationId, studentId)];
    }
  } catch (err) {
    liError = err instanceof Error ? err.message : "Learning Intelligence unavailable";
  }

  if (opts?.organizationId) {
    publishParentExperienceEvent({
      type: "parent.learning_summary_viewed",
      organizationId: opts.organizationId,
      recordType: "student",
      recordId: studentId,
      actorUserId: opts.actorUserId,
      payload: {
        learningIntelligence: "LearningIntelligenceEngine",
        assessmentCount: String(progress.assessments.length),
      },
      projectLive: false,
    });
  }

  const strengths = progress.goals
    .filter((g) => String(g.status ?? "").toLowerCase().includes("met") || String(g.status ?? "").toLowerCase().includes("complete"))
    .slice(0, 5)
    .map((g) => String(g.title ?? g.goal_text ?? "Goal progress"));

  const growthAreas = progress.interventions
    .filter((i) => String(i.status ?? "").toLowerCase() === "active")
    .slice(0, 5)
    .map((i) => String(i.title ?? i.intervention_type ?? "Active intervention"));

  return {
    progress,
    masteryFromLearningIntelligence: liMastery,
    learningIntelligenceError: liError,
    strengths,
    areasForGrowth: growthAreas,
    teacherFeedback: progress.observations.slice(0, 8),
    recommendations: progress.interventions.slice(0, 5),
  };
}
