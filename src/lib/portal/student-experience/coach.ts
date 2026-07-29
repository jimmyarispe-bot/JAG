/**
 * AI Learning Coach — evidence-backed guidance from Learning Intelligence + progress data.
 * Never invents mastery levels, diagnoses, or scores not present in source records.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getParentLearningSummary } from "@/lib/portal/experience/learning";
import { publishStudentExperienceEvent } from "./events";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type CoachGuidance = {
  readonly summary: string;
  readonly encouragement: string;
  readonly suggestedNextSkills: readonly string[];
  readonly studyRecommendations: readonly string[];
  readonly evidenceNotes: readonly string[];
  readonly questions: readonly string[];
  readonly source: "LearningIntelligenceEngine";
};

export async function getStudentLearningCoachGuidance(
  supabase: AuthClient,
  studentId: string,
  opts?: { organizationId?: string | null; actorUserId?: string | null }
): Promise<CoachGuidance> {
  const learning = await getParentLearningSummary(supabase, studentId, {
    organizationId: opts?.organizationId,
    actorUserId: opts?.actorUserId,
  });

  const mastery = learning.masteryFromLearningIntelligence as Array<{
    level?: string;
    objectiveId?: string;
  }>;

  const suggestedNextSkills = mastery
    .filter((m) => {
      const level = String(m.level ?? "").toLowerCase();
      return level.includes("developing") || level.includes("emerging") || level.includes("beginning");
    })
    .slice(0, 5)
    .map((m) => String(m.objectiveId ?? "Continue practicing this skill"));

  const fromGrowth = learning.areasForGrowth.slice(0, 5);
  const skills =
    suggestedNextSkills.length > 0
      ? suggestedNextSkills
      : fromGrowth.length > 0
        ? fromGrowth.map((g) => `Focus practice: ${g}`)
        : ["Keep working on your active goals — check My Learning for details."];

  const studyRecommendations = [
    ...learning.recommendations.slice(0, 3).map((r) => {
      const row = r as Record<string, unknown>;
      return String(row.title ?? row.intervention_type ?? "Follow your teacher’s plan");
    }),
    learning.progress.assessments.length > 0
      ? "Review your latest assessment feedback in Assessments."
      : "Complete upcoming assignments to unlock more feedback.",
  ].filter(Boolean);

  const evidenceNotes = [
    `${learning.progress.assessments.length} assessment record(s) on file`,
    `${learning.progress.goals.length} goal record(s)`,
    `${mastery.length} mastery record(s) from Learning Intelligence`,
    `${learning.progress.observations.length} teacher observation(s)`,
  ];

  const strengthsLine =
    learning.strengths.length > 0
      ? `You are building strength in: ${learning.strengths.slice(0, 3).join(", ")}.`
      : "Keep showing up — your goals and practice build momentum.";

  const summary = [
    "This guidance is based only on your recorded goals, assessments, interventions, and mastery data.",
    strengthsLine,
    learning.areasForGrowth.length
      ? `Growth focus areas from your records: ${learning.areasForGrowth.slice(0, 3).join(", ")}.`
      : "No active intervention growth areas are on file right now.",
  ].join(" ");

  if (opts?.organizationId) {
    publishStudentExperienceEvent({
      type: "student.coach_consulted",
      organizationId: opts.organizationId,
      recordType: "student",
      recordId: studentId,
      actorUserId: opts.actorUserId,
      payload: {
        learningIntelligence: "LearningIntelligenceEngine",
        evidenceCount: String(evidenceNotes.length),
      },
      projectLive: false,
    });
  }

  return {
    summary,
    encouragement:
      "Small steps count. Use your schedule and assignments list — your teachers and Learning Intelligence track real progress, not guesses.",
    suggestedNextSkills: skills,
    studyRecommendations,
    evidenceNotes,
    questions: [
      "Which goal do you want to practice for 10 minutes today?",
      "Do you have questions for your teacher about a recent assessment?",
      "Which assignment is due soon that you can start now?",
    ],
    source: "LearningIntelligenceEngine",
  };
}
