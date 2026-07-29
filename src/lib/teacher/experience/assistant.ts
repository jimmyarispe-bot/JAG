/**
 * AI Teaching Assistant — evidence-backed recommendations from Learning Intelligence
 * + existing teacher progress / intervention / literacy helpers.
 * Never fabricates mastery levels or diagnoses.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getParentLearningSummary } from "@/lib/portal/experience/learning";
import { recommendNextStructuredLiteracyStep } from "@/lib/teacher/progress";
import { getTeacherInterventions, getTeacherRosterStudents } from "@/lib/teacher/queries";
import { publishTeacherExperienceEvent } from "./events";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type TeachingAssistantGuidance = {
  readonly summary: string;
  readonly lessonRecommendations: readonly string[];
  readonly interventionSuggestions: readonly string[];
  readonly questionPrompts: readonly string[];
  readonly progressSummaries: readonly string[];
  readonly nextInstructionalTargets: readonly string[];
  readonly evidenceNotes: readonly string[];
  readonly source: "LearningIntelligenceEngine";
};

export async function getTeachingAssistantGuidance(
  supabase: AuthClient,
  employeeId: string,
  opts?: {
    organizationId?: string | null;
    actorUserId?: string | null;
    focusStudentId?: string | null;
  }
): Promise<TeachingAssistantGuidance> {
  const [roster, interventions] = await Promise.all([
    getTeacherRosterStudents(supabase, employeeId),
    getTeacherInterventions(supabase, employeeId),
  ]);

  const focusId =
    opts?.focusStudentId ??
    (roster[0] as { id?: string } | undefined)?.id ??
    null;

  const learning = focusId
    ? await getParentLearningSummary(supabase, focusId, {
        organizationId: opts?.organizationId,
        actorUserId: opts?.actorUserId,
      })
    : null;

  const mastery = (learning?.masteryFromLearningIntelligence ?? []) as Array<{
    level?: string;
    objectiveId?: string;
  }>;

  const literacy = recommendNextStructuredLiteracyStep(1, 1, false);

  const nextInstructionalTargets = [
    ...mastery
      .filter((m) => {
        const level = String(m.level ?? "").toLowerCase();
        return (
          level.includes("developing") ||
          level.includes("emerging") ||
          level.includes("beginning")
        );
      })
      .slice(0, 5)
      .map((m) => `Target skill (LI): ${m.objectiveId ?? "objective"} @ ${m.level}`),
    literacy.recommendation,
  ];

  const interventionSuggestions = interventions.slice(0, 5).map((i) => {
    const st = Array.isArray(i.students) ? i.students[0] : i.students;
    const name = st
      ? `${(st as { first_name?: string }).first_name ?? ""} ${(st as { last_name?: string }).last_name ?? ""}`.trim()
      : "Student";
    return `${name}: ${i.title ?? i.intervention_type ?? "Active intervention"} (review ${i.review_date ?? "soon"})`;
  });

  const lessonRecommendations = [
    learning?.areasForGrowth[0]
      ? `Plan practice aligned to growth area: ${learning.areasForGrowth[0]}`
      : "Open Lesson Planning to reuse an existing curriculum plan for today’s section.",
    learning?.strengths[0]
      ? `Build on recorded strength: ${learning.strengths[0]}`
      : "Check roster mastery in Progress Monitoring before introducing new content.",
  ];

  const progressSummaries = [
    focusId
      ? `Focus student has ${learning?.progress.assessments.length ?? 0} assessment(s), ${learning?.progress.goals.length ?? 0} goal(s), ${mastery.length} LI mastery record(s).`
      : "Select a student from My Classes to load Learning Intelligence evidence.",
    `${roster.length} roster student(s); ${interventions.length} active intervention(s) assigned to you.`,
  ];

  const evidenceNotes = [
    `Roster size: ${roster.length}`,
    `Active interventions: ${interventions.length}`,
    focusId ? `LI mastery rows for focus student: ${mastery.length}` : "No focus student selected",
    `Assessments on file (focus): ${learning?.progress.assessments.length ?? 0}`,
    `Teacher observations (focus): ${learning?.progress.observations.length ?? 0}`,
    "Structured literacy next-step helper used (Academy Way progress service)",
  ];

  if (opts?.organizationId) {
    publishTeacherExperienceEvent({
      type: "teacher.assistant_consulted",
      organizationId: opts.organizationId,
      recordType: "employee",
      recordId: employeeId,
      actorUserId: opts.actorUserId,
      payload: {
        learningIntelligence: "LearningIntelligenceEngine",
        focusStudentId: focusId ?? "",
        evidenceCount: String(evidenceNotes.length),
      },
      projectLive: false,
    });
  }

  return {
    summary:
      "Recommendations below are derived only from roster interventions, Learning Intelligence mastery/assessment records, and Academy Way literacy helpers — not invented diagnoses.",
    lessonRecommendations,
    interventionSuggestions: interventionSuggestions.length
      ? interventionSuggestions
      : ["No active interventions assigned — review Progress Monitoring for emerging needs from LI evidence."],
    questionPrompts: [
      "Which objective from today’s lesson maps to a developing LI skill?",
      "Who on the roster has an intervention review due this week?",
      "What evidence (assessment or observation) supports the next instructional target?",
    ],
    progressSummaries,
    nextInstructionalTargets,
    evidenceNotes,
    source: "LearningIntelligenceEngine",
  };
}
