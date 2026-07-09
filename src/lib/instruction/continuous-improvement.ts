import "@/lib/instruction/catalog/register";

import {
  resolveInstructionDeliveryContext,
  type InstructionDeliveryContext,
} from "@/lib/instruction/delivery-context";
import { recordInterventionEffectiveness } from "@/lib/instruction/effectiveness";
import { buildSessionCloseoutSummary } from "@/lib/instruction/session-closeout";
import { publishEvent } from "@/lib/platform/events/publisher/publish";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";
import { recordGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type { RecordGraphEdgeInput } from "@/lib/platform/intelligence-graph/persistence/types";
import type { IdentityContext } from "@/lib/platform/identity/context";
import { publishPajEvent } from "@/lib/platform/paj/integration/events";
import { evaluateJourneyRecommendations } from "@/lib/platform/paj/recommendations";
import { evaluateRuleSet } from "@/lib/platform/rules/engine/execute";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

import {
  parseImprovementAttachmentRefs,
  type LearnerEngagementLevel,
  type SessionImprovementAnalysis,
  type SessionImprovementCapture,
  type SessionImprovementLoopSnapshot,
} from "@/lib/instruction/continuous-improvement-parse";

export type {
  LearnerEngagementLevel,
  SessionImprovementAnalysis,
  SessionImprovementCapture,
  SessionImprovementLoopSnapshot,
} from "@/lib/instruction/continuous-improvement-parse";
export { parseImprovementAttachmentRefs } from "@/lib/instruction/continuous-improvement-parse";

export type EffectivenessRating = "strong" | "moderate" | "needs_improvement";
export type RepeatabilityRating = "high" | "medium" | "low";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ENGAGEMENT_SCORES: Record<LearnerEngagementLevel, number> = {
  active: 90,
  moderate: 65,
  minimal: 35,
  unknown: 50,
};

/** Capture instructional session inputs for the Continuous Improvement Loop. */
export function captureSessionImprovementInputs(
  ctx: InstructionDeliveryContext,
  options: {
    sessionNotes?: string | null;
    artifactCount: number;
    assessmentCount: number;
    outcomeRecorded: boolean;
    teacherReflection?: string | null;
    learnerEngagement?: LearnerEngagementLevel;
  }
): SessionImprovementCapture {
  const closeout = buildSessionCloseoutSummary(ctx, {
    sessionNotes: options.sessionNotes ?? null,
    homework: null,
    artifactCount: options.artifactCount,
    assessmentCount: options.assessmentCount,
    outcomeRecorded: options.outcomeRecorded,
  });

  const strategies = [
    ...(ctx.guidance?.instructionalStrategies ?? []),
    ...ctx.lessonObjectives.slice(0, 3),
  ].filter(Boolean);

  const resources = [
    ...ctx.knowledgeAssets.map((a) => a.title),
    ...ctx.lessonPlans.slice(0, 3).map((p) => p.title ?? "Lesson plan"),
  ].filter(Boolean);

  const interventionsDelivered = ctx.learnerProfile.activeInterventions.map(
    (iv) => `${iv.type}${iv.goal ? `: ${iv.goal}` : ""}`
  );

  return {
    sessionId: ctx.sessionId,
    studentId: ctx.student.id,
    capturedAt: new Date().toISOString(),
    instructionalStrategies: [...new Set(strategies)],
    instructionalResources: [...new Set(resources)],
    accommodations: ctx.accommodations,
    interventionsDelivered,
    competencyOutcomes: {
      competencyKey: ctx.activeCompetency?.competencyKey ?? null,
      competencyTitle: ctx.activeCompetency?.title ?? null,
      masteryLevel: ctx.competencyProgress?.mastery_level ?? null,
      outcomeRecorded: options.outcomeRecorded,
    },
    evidenceQuality: {
      score: closeout.evidenceCompleteness.score,
      artifactCount: options.artifactCount,
      assessmentCount: options.assessmentCount,
      platformEvidenceCount: ctx.platformEvidence.length,
      missing: closeout.evidenceCompleteness.missing,
    },
    teacherReflection: options.teacherReflection?.trim() || null,
    learnerEngagement: options.learnerEngagement ?? "unknown",
    familyCommunicationOutcome: {
      parentRemindersPending: ctx.parentReminders.length,
      draftGenerated: closeout.familyCommunicationDraft.length > 0,
    },
  };
}

/** Analyze captured session inputs — explainable, rules-backed effectiveness scoring. */
export async function analyzeSessionImprovement(
  supabase: AuthClient,
  capture: SessionImprovementCapture,
  ctx: InstructionDeliveryContext,
  options: {
    schoolId?: string;
    organizationId?: string;
    actorUserId?: string;
  } = {}
): Promise<SessionImprovementAnalysis> {
  const whatWorked: string[] = [];
  const whatDidNot: string[] = [];

  if (capture.evidenceQuality.score >= 75) {
    whatWorked.push(`Documentation quality scored ${capture.evidenceQuality.score}%`);
  } else {
    whatDidNot.push(`Documentation incomplete (${capture.evidenceQuality.score}%)`);
  }

  if (capture.competencyOutcomes.outcomeRecorded) {
    whatWorked.push("Competency outcome recorded for learner");
  } else {
    whatDidNot.push("Competency outcome not yet recorded");
  }

  if (capture.accommodations.length) {
    whatWorked.push(`Applied ${capture.accommodations.length} accommodation(s)`);
  }

  if (capture.learnerEngagement === "active") {
    whatWorked.push("Teacher reported active learner engagement");
  } else if (capture.learnerEngagement === "minimal") {
    whatDidNot.push("Learner engagement reported as minimal — review strategies");
  }

  if (capture.teacherReflection?.length) {
    whatWorked.push("Teacher reflection captured for future sessions");
  }

  if (capture.interventionsDelivered.length) {
    whatWorked.push(`Delivered ${capture.interventionsDelivered.length} active intervention(s)`);
  }

  const engagementScore = ENGAGEMENT_SCORES[capture.learnerEngagement];
  const placementScore = Math.round(
    capture.evidenceQuality.score * 0.55 +
      engagementScore * 0.25 +
      (capture.competencyOutcomes.outcomeRecorded ? 20 : 0)
  );

  let ruleOutcomeKey: string | undefined;
  let explanation: string | undefined;

  try {
    const ruleResult = await evaluateRuleSet(
      {
        ruleSetKey: "ref_student_placement",
        facts: { placement_score: placementScore },
        entityType: "instructional_sessions",
        entityId: capture.sessionId,
        schoolId: options.schoolId,
        organizationId: options.organizationId,
        actorUserId: options.actorUserId,
        metadata: { studentId: capture.studentId, loop: "continuous_improvement" },
      },
      { persist: { supabase }, recordAudit: true }
    );
    ruleOutcomeKey = ruleResult.primaryOutcome?.outcomeKey;
    explanation = ruleResult.explanation.summary;
  } catch {
    // Rules evaluation is best-effort — heuristics still apply
  }

  const effectiveness: EffectivenessRating =
    placementScore >= 75 ? "strong" : placementScore >= 50 ? "moderate" : "needs_improvement";

  const repeatability: RepeatabilityRating =
    capture.evidenceQuality.score >= 70 &&
    capture.instructionalStrategies.length > 0 &&
    capture.competencyOutcomes.outcomeRecorded
      ? "high"
      : capture.evidenceQuality.score >= 45
        ? "medium"
        : "low";

  const confidence = Math.min(
    100,
    Math.round(
      capture.evidenceQuality.score * 0.4 +
        (capture.teacherReflection ? 15 : 0) +
        (capture.competencyOutcomes.outcomeRecorded ? 20 : 0) +
        (capture.learnerEngagement !== "unknown" ? 15 : 0) +
        (ruleOutcomeKey ? 10 : 0)
    )
  );

  const closeout = buildSessionCloseoutSummary(ctx, {
    sessionNotes: capture.teacherReflection,
    homework: null,
    artifactCount: capture.evidenceQuality.artifactCount,
    assessmentCount: capture.evidenceQuality.assessmentCount,
    outcomeRecorded: capture.competencyOutcomes.outcomeRecorded,
  });

  const executiveReporting = [
    `Session effectiveness: ${effectiveness} (${placementScore}/100)`,
    `Evidence quality: ${capture.evidenceQuality.score}%`,
    `Repeatability: ${repeatability}`,
  ];
  if (capture.competencyOutcomes.competencyTitle) {
    executiveReporting.push(
      `Competency: ${capture.competencyOutcomes.competencyTitle} (L${capture.competencyOutcomes.masteryLevel ?? 0})`
    );
  }

  const familyGuidance: string[] = [];
  if (capture.familyCommunicationOutcome.draftGenerated) {
    familyGuidance.push("Family communication draft ready for review and send");
  }
  if (capture.familyCommunicationOutcome.parentRemindersPending > 0) {
    familyGuidance.push(
      `${capture.familyCommunicationOutcome.parentRemindersPending} parent reminder(s) pending follow-up`
    );
  }

  return {
    whatWorked,
    whatDidNot,
    confidence,
    effectiveness,
    repeatability,
    recommendations: {
      instructional: closeout.instructionalRecommendations,
      interventions: closeout.interventionRecommendations,
      scheduling: closeout.schedulingRecommendations,
      competencySequencing: closeout.nextCompetencyRecommendation
        ? [closeout.nextCompetencyRecommendation]
        : [],
      familyGuidance,
      executiveReporting,
    },
    ruleOutcomeKey,
    explanation,
  };
}

async function syncImprovementGraphEdges(
  supabase: AuthClient,
  capture: SessionImprovementCapture,
  analysis: SessionImprovementAnalysis,
  options: { schoolId?: string; organizationId?: string }
): Promise<void> {
  const sessionNodeId = buildGraphNodeId("entity", "instructional_sessions", capture.sessionId);
  const studentNodeId = buildGraphNodeId("entity", "student", capture.studentId);

  const edges: RecordGraphEdgeInput[] = [
    {
      edgeType: "instructional_session.delivered_to.student",
      sourceNodeId: sessionNodeId,
      targetNodeId: studentNodeId,
      providerKey: "continuous_improvement",
      schoolId: options.schoolId,
      organizationId: options.organizationId,
      metadata: {
        effectiveness: analysis.effectiveness,
        confidence: analysis.confidence,
        repeatability: analysis.repeatability,
      },
    },
  ];

  if (capture.competencyOutcomes.competencyKey) {
    const competencyNodeId = buildGraphNodeId(
      "competency",
      "competency",
      capture.competencyOutcomes.competencyKey
    );
    edges.push({
      edgeType: "instructional_session.targeted.competency",
      sourceNodeId: sessionNodeId,
      targetNodeId: competencyNodeId,
      providerKey: "continuous_improvement",
      schoolId: options.schoolId,
      organizationId: options.organizationId,
      metadata: {
        masteryLevel: capture.competencyOutcomes.masteryLevel,
        evidenceScore: capture.evidenceQuality.score,
      },
    });
  }

  for (const strategy of capture.instructionalStrategies.slice(0, 5)) {
    const strategyNodeId = buildGraphNodeId("strategy", "instructional_strategy", strategy);
    edges.push({
      edgeType: "instructional_session.applied.strategy",
      sourceNodeId: sessionNodeId,
      targetNodeId: strategyNodeId,
      providerKey: "continuous_improvement",
      schoolId: options.schoolId,
      organizationId: options.organizationId,
      metadata: { effectiveness: analysis.effectiveness },
    });
  }

  await recordGraphEdges(supabase, edges);
}

async function persistImprovementSnapshot(
  supabase: AuthClient,
  sessionId: string,
  snapshot: SessionImprovementLoopSnapshot,
  teacherReflection?: string | null,
  learnerEngagement?: LearnerEngagementLevel
): Promise<void> {
  const { data: delivery } = await supabase
    .from("instructional_session_deliveries")
    .select("attachment_refs")
    .eq("instructional_session_id", sessionId)
    .maybeSingle();

  const existing = Array.isArray(delivery?.attachment_refs) ? delivery!.attachment_refs : [];
  const filtered = existing.filter(
    (item) =>
      !isRecord(item) ||
      (item.kind !== "continuous_improvement" && item.kind !== "teacher_reflection")
  );

  const refs: unknown[] = [...filtered, snapshot];
  if (teacherReflection?.trim() || (learnerEngagement && learnerEngagement !== "unknown")) {
    refs.push({
      kind: "teacher_reflection",
      body: teacherReflection?.trim() ?? "",
      engagement: learnerEngagement ?? "unknown",
      updatedAt: new Date().toISOString(),
    });
  }

  await supabase
    .from("instructional_session_deliveries")
    .update({ attachment_refs: refs })
    .eq("instructional_session_id", sessionId);
}

/** Feed analysis back into platform intelligence — events, graph, PAJ, interventions. */
export async function applySessionImprovementFeedback(
  supabase: AuthClient,
  capture: SessionImprovementCapture,
  analysis: SessionImprovementAnalysis,
  ctx: InstructionDeliveryContext,
  options: {
    actorUserId: string;
    schoolId?: string;
    organizationId?: string;
  }
): Promise<void> {
  const snapshot: SessionImprovementLoopSnapshot = {
    kind: "continuous_improvement",
    sessionId: capture.sessionId,
    studentId: capture.studentId,
    recordedAt: capture.capturedAt,
    capture,
    analysis,
  };

  await persistImprovementSnapshot(
    supabase,
    capture.sessionId,
    snapshot,
    capture.teacherReflection,
    capture.learnerEngagement
  );

  await publishEvent(
    {
      eventType: "instruction.session.improvement_completed",
      entityType: "instructional_sessions",
      entityId: capture.sessionId,
      schoolId: options.schoolId,
      organizationId: options.organizationId,
      actorId: options.actorUserId,
      payload: {
        studentId: capture.studentId,
        effectiveness: analysis.effectiveness,
        confidence: analysis.confidence,
        repeatability: analysis.repeatability,
        competencyKey: capture.competencyOutcomes.competencyKey,
        evidenceScore: capture.evidenceQuality.score,
        recommendations: analysis.recommendations,
      },
    },
    { persist: { supabase }, recordAudit: true }
  );

  await syncImprovementGraphEdges(supabase, capture, analysis, {
    schoolId: options.schoolId,
    organizationId: options.organizationId,
  });

  if (ctx.journey && capture.competencyOutcomes.competencyKey) {
    await publishPajEvent(supabase, {
      eventType: "learning.mastery.updated",
      journeyId: ctx.journey.journey.id,
      studentId: capture.studentId,
      schoolId: options.schoolId,
      organizationId: options.organizationId,
      actorUserId: options.actorUserId,
      payload: {
        source: "continuous_improvement_loop",
        sessionId: capture.sessionId,
        competencyKey: capture.competencyOutcomes.competencyKey,
        masteryLevel: capture.competencyOutcomes.masteryLevel,
        effectiveness: analysis.effectiveness,
      },
    });

    try {
      await evaluateJourneyRecommendations({
        supabase,
        studentId: capture.studentId,
        schoolId: options.schoolId,
        organizationId: options.organizationId,
        activeCompetencyKey: capture.competencyOutcomes.competencyKey,
        competencyProgress: ctx.journey.competencyProgress,
        actorUserId: options.actorUserId,
      });
    } catch {
      // Recommendation refresh is best-effort
    }
  }

  for (const iv of ctx.learnerProfile.activeInterventions.slice(0, 3)) {
    await recordInterventionEffectiveness(supabase, {
      interventionId: iv.id,
      studentId: capture.studentId,
      minutesDelivered: 45,
      sessionsDelivered: 1,
      progressScore: capture.evidenceQuality.score,
      progressTrend:
        analysis.effectiveness === "strong"
          ? "improving"
          : analysis.effectiveness === "moderate"
            ? "stable"
            : "needs_attention",
      effectivenessRating: analysis.effectiveness === "needs_improvement" ? "weak" : analysis.effectiveness,
      outcomeNotes: analysis.whatWorked.slice(0, 2).join("; ") || undefined,
      recordedBy: options.actorUserId,
      periodEnd: capture.capturedAt,
    });
  }
}

/** Run the full Continuous Improvement Loop after session completion. */
export async function runContinuousImprovementLoop(
  supabase: AuthClient,
  input: {
    sessionId: string;
    studentId: string;
    identity: IdentityContext;
    employeeId: string;
    sessionRow: Record<string, unknown>;
    delivery: Record<string, unknown> | null;
    course: { name?: string } | null;
    sectionCode: string;
    scheduledLabel: string;
    sessionNotes?: string | null;
    teacherReflection?: string | null;
    learnerEngagement?: LearnerEngagementLevel;
    artifactCount?: number;
    assessmentCount?: number;
    outcomeRecorded?: boolean;
    schoolId?: string;
    organizationId?: string;
  }
): Promise<SessionImprovementLoopSnapshot> {
  const ctx = await resolveInstructionDeliveryContext({
    supabase,
    sessionId: input.sessionId,
    studentId: input.studentId,
    employeeId: input.employeeId,
    identity: input.identity,
    sessionRow: input.sessionRow,
    delivery: input.delivery,
    course: input.course,
    sectionCode: input.sectionCode,
    scheduledLabel: input.scheduledLabel,
  });

  const capture = captureSessionImprovementInputs(ctx, {
    sessionNotes: input.sessionNotes,
    artifactCount: input.artifactCount ?? 0,
    assessmentCount: input.assessmentCount ?? 0,
    outcomeRecorded: input.outcomeRecorded ?? false,
    teacherReflection: input.teacherReflection,
    learnerEngagement: input.learnerEngagement,
  });

  const analysis = await analyzeSessionImprovement(supabase, capture, ctx, {
    schoolId: input.schoolId ?? ctx.journey?.journey.school_id ?? undefined,
    organizationId: input.organizationId ?? ctx.journey?.journey.organization_id ?? undefined,
    actorUserId: input.identity.effectiveUserId,
  });

  await applySessionImprovementFeedback(supabase, capture, analysis, ctx, {
    actorUserId: input.identity.effectiveUserId,
    schoolId: input.schoolId ?? ctx.journey?.journey.school_id ?? undefined,
    organizationId: input.organizationId ?? ctx.journey?.journey.organization_id ?? undefined,
  });

  await fireInstructionLoopTransitions(supabase, {
    sessionId: input.sessionId,
    studentId: input.studentId,
    schoolId: input.schoolId ?? ctx.journey?.journey.school_id ?? undefined,
    actorUserId: input.identity.effectiveUserId,
    capture,
  });

  return {
    kind: "continuous_improvement",
    sessionId: input.sessionId,
    studentId: input.studentId,
    recordedAt: capture.capturedAt,
    capture,
    analysis,
  };
}

async function fireInstructionLoopTransitions(
  supabase: AuthClient,
  input: {
    sessionId: string;
    studentId: string;
    schoolId?: string;
    actorUserId?: string;
    capture: SessionImprovementCapture;
  }
) {
  const { fireOperationalLoopTransition } = await import(
    "@/lib/platform/operational-loop"
  );
  if (!input.schoolId) return;

  const base = {
    studentId: input.studentId,
    schoolId: input.schoolId,
    actorUserId: input.actorUserId,
    relatedEntityType: "instructional_sessions",
    relatedEntityId: input.sessionId,
  };

  await fireOperationalLoopTransition(supabase, {
    ...base,
    transitionKey: "instruction_to_evidence",
    facts: {
      artifactCount: input.capture.evidenceQuality.artifactCount,
      evidenceScore: input.capture.evidenceQuality.score,
    },
  });

  if (input.capture.competencyOutcomes.outcomeRecorded) {
    await fireOperationalLoopTransition(supabase, {
      ...base,
      transitionKey: "evidence_to_progress",
      facts: {
        competencyKey: input.capture.competencyOutcomes.competencyKey,
        masteryLevel: input.capture.competencyOutcomes.masteryLevel,
      },
    });
  }

  if (
    input.capture.familyCommunicationOutcome.parentRemindersPending > 0 ||
    input.capture.familyCommunicationOutcome.draftGenerated
  ) {
    await fireOperationalLoopTransition(supabase, {
      ...base,
      transitionKey: "progress_to_parent_communication",
      facts: {
        parentRemindersPending: input.capture.familyCommunicationOutcome.parentRemindersPending,
      },
    });
  }
}
