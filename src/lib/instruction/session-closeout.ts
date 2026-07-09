import type { SessionImprovementAnalysis } from "@/lib/instruction/continuous-improvement";
import { getUlrCompetency } from "@/lib/platform/ulr/registry/registry";
import type { InstructionDeliveryContext } from "@/lib/instruction/delivery-context";

export interface SessionCloseoutSummary {
  progressSummary: string;
  familyCommunicationDraft: string;
  instructionalRecommendations: string[];
  interventionRecommendations: string[];
  schedulingRecommendations: string[];
  evidenceCompleteness: { complete: boolean; missing: string[]; score: number };
  nextCompetencyRecommendation: string | null;
  improvementLoop?: SessionImprovementAnalysis;
}

const MASTERY_LABELS = ["Not started", "Emerging", "Developing", "Proficient", "Advanced"];

/** Build post-instruction outputs from resolved delivery context and session artifacts. */
export function buildSessionCloseoutSummary(
  ctx: InstructionDeliveryContext,
  options: {
    sessionNotes?: string | null;
    homework?: string | null;
    artifactCount: number;
    assessmentCount: number;
    outcomeRecorded: boolean;
  }
): SessionCloseoutSummary {
  const competency = ctx.activeCompetency;
  const progress = ctx.competencyProgress;
  const masteryLabel =
    progress != null ? MASTERY_LABELS[progress.mastery_level] ?? "In progress" : "Not recorded";

  const progressSummary = [
    `Session: ${ctx.courseName} (${ctx.sectionCode}) with ${ctx.student.firstName} ${ctx.student.lastName}.`,
    competency ? `Target competency: ${competency.title} — ${masteryLabel}.` : "No active competency on journey.",
    options.sessionNotes ? `Notes: ${options.sessionNotes.slice(0, 280)}` : "Session notes pending documentation.",
    `${options.artifactCount} artifact(s) and ${options.assessmentCount} assessment(s) captured this session.`,
  ].join(" ");

  const familyCommunicationDraft = [
    "Hello,",
    "",
    `Today ${ctx.student.firstName} participated in ${ctx.courseName}.`,
    competency ? `We focused on ${competency.title}.` : "",
    options.sessionNotes ? `${options.sessionNotes}` : "Instruction proceeded as planned.",
    options.homework ? `Practice at home: ${options.homework}` : "",
    ctx.accommodations.length
      ? `Accommodations applied: ${ctx.accommodations.slice(0, 3).join("; ")}.`
      : "",
    "",
    "Please reach out if you have questions.",
  ]
    .filter(Boolean)
    .join("\n");

  const instructionalRecommendations: string[] = [];
  for (const rec of ctx.engineRecommendations) {
    instructionalRecommendations.push(`${rec.title}: ${rec.rationale}`);
  }
  if (ctx.pajRecommendations?.learningRecommendation) {
    instructionalRecommendations.push(ctx.pajRecommendations.learningRecommendation.label);
  }
  if (ctx.guidance?.instructionalStrategies.length) {
    instructionalRecommendations.push(
      `ULR strategies: ${ctx.guidance.instructionalStrategies.slice(0, 3).join(", ")}`
    );
  }

  const interventionRecommendations: string[] = [];
  if (ctx.pajRecommendations?.interventionRecommendation) {
    interventionRecommendations.push(ctx.pajRecommendations.interventionRecommendation.label);
  }
  for (const iv of ctx.learnerProfile.activeInterventions) {
    interventionRecommendations.push(`${iv.type}${iv.goal ? `: ${iv.goal}` : ""}`);
  }
  if (ctx.guidance?.interventionStrategies.length) {
    interventionRecommendations.push(
      `Suggested interventions: ${ctx.guidance.interventionStrategies.slice(0, 2).join(", ")}`
    );
  }

  const schedulingRecommendations: string[] = [];
  if (ctx.guidance?.schedulingRuleKeys.length) {
    schedulingRecommendations.push(
      `Review scheduling rules: ${ctx.guidance.schedulingRuleKeys.join(", ")}`
    );
  }
  if (!ctx.prerequisiteStatus.ok) {
    schedulingRecommendations.push(
      `Schedule prerequisite review before advancing: ${ctx.prerequisiteStatus.missing.join(", ")}`
    );
  }
  if (ctx.parentReminders.length) {
    schedulingRecommendations.push(`Follow up on ${ctx.parentReminders.length} parent communication item(s).`);
  }

  const missing: string[] = [];
  const minEvidence = competency?.minimumEvidenceCount ?? 1;
  const evidenceCount = ctx.platformEvidence.length + options.artifactCount;
  if (evidenceCount < minEvidence) missing.push(`${minEvidence - evidenceCount} more evidence item(s)`);
  if (!options.outcomeRecorded) missing.push("Session outcome / mastery update");
  if (!options.sessionNotes?.trim()) missing.push("Session notes");
  if (ctx.accommodations.length && !options.sessionNotes?.toLowerCase().includes("accommodation")) {
    missing.push("Accommodation documentation in notes");
  }

  const requiredChecks = 3 + (competency ? 1 : 0);
  const passedChecks = requiredChecks - missing.length;
  const score = Math.round(Math.max(0, (passedChecks / requiredChecks) * 100));

  let nextCompetencyRecommendation: string | null = null;
  if (competency?.nextCompetencyKeys.length) {
    const nextKey = competency.nextCompetencyKeys[0]!;
    const next = getUlrCompetency(nextKey);
    if (ctx.prerequisiteStatus.ok && (progress?.mastery_level ?? 0) >= 3) {
      nextCompetencyRecommendation = `Ready to introduce: ${next?.title ?? nextKey}`;
    } else {
      nextCompetencyRecommendation = `Continue ${competency.title} until proficient before ${next?.title ?? nextKey}`;
    }
  }

  return {
    progressSummary,
    familyCommunicationDraft,
    instructionalRecommendations,
    interventionRecommendations,
    schedulingRecommendations,
    evidenceCompleteness: { complete: missing.length === 0, missing, score },
    nextCompetencyRecommendation,
  };
}
