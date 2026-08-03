/**
 * Support Planning synthesis — unifies Intervention + Family Engagement + Student Success.
 */

import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countSupportPlanningUpstream,
  type SupportPlanningInputs,
} from "./SupportPlanningInputs";
import type {
  SupportPlanStance,
  SupportPlanningEvidenceCode,
} from "./SupportPlanningTypes";

export interface SupportPlanningAnalysis {
  stance: SupportPlanStance;
  signals: SupportPlanningEvidenceCode[];
  prioritizedActions: string[];
  expectedOutcomes: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
  };
  upstreamSummary: {
    intervention?: UpstreamSlice;
    familyEngagement?: UpstreamSlice;
    studentSuccess?: UpstreamSlice;
  };
}

interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  priority: number;
  blockingCount: number;
  warningCount: number;
  recommendationKinds: readonly string[];
  evidenceCodes: readonly string[];
}

export function validateSupportPlanningInputs(
  inputs: SupportPlanningInputs
): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Support planning inputs require subjectId");
  }
}

export function analyzeSupportPlanning(
  inputs: SupportPlanningInputs
): SupportPlanningAnalysis {
  const intervention = sliceUpstream(
    "education.cognition.intervention",
    inputs.intervention
  );
  const familyEngagement = sliceUpstream(
    "education.cognition.family_engagement",
    inputs.familyEngagement
  );
  const studentSuccess = sliceUpstream(
    "education.cognition.student_success",
    inputs.studentSuccess
  );

  if (countSupportPlanningUpstream(inputs) === 0) {
    return {
      stance: "insufficient",
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      prioritizedActions: [],
      expectedOutcomes: [],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const signals: SupportPlanningEvidenceCode[] = [
    "synthesis_inputs_bound",
    "unified_support_plan",
  ];
  if (intervention) signals.push("upstream_intervention");
  if (familyEngagement) signals.push("upstream_family_engagement");
  if (studentSuccess) signals.push("upstream_student_success");

  const intensive =
    hasAny(intervention, [
      "multi_domain_intervention",
      "mtss_escalation",
      "high_priority_support",
    ]) ||
    hasRec(intervention, "multi_domain") ||
    hasRec(intervention, "escalate") ||
    hasAny(studentSuccess, ["high_academic_risk", "conflicting_outputs"]);

  const targeted =
    hasAny(intervention, [
      "academic_intervention_indicated",
      "attendance_intervention_indicated",
      "intervention_candidate",
    ]) ||
    hasAny(studentSuccess, ["emerging_risk", "attendance_concern", "intervention_needed"]);

  const familyLed =
    hasAny(familyEngagement, [
      "attendance_partnership",
      "risk_outreach",
      "progress_conference",
      "communication_priority_urgent",
      "communication_priority_high",
    ]) && !intensive;

  const monitor =
    hasAny(intervention, ["monitor_only"]) ||
    hasAny(studentSuccess, [
      "healthy_learner",
      "positive_momentum",
      "outstanding_achievement",
      "improving_trajectory",
    ]);

  let stance: SupportPlanStance = "monitor_and_maintain";
  if (intensive) {
    stance = "intensive_support";
    signals.push("intensive_support");
  } else if (targeted) {
    stance = "targeted_support";
    signals.push("targeted_support");
  } else if (familyLed) {
    stance = "family_led_partnership";
    signals.push("family_led_partnership");
  } else {
    stance = "monitor_and_maintain";
    signals.push("monitor_and_maintain");
  }

  const prioritizedActions = buildPrioritizedActions({
    stance,
    intervention,
    familyEngagement,
  });
  if (prioritizedActions.length > 0) signals.push("prioritized_actions");

  const expectedOutcomes = buildExpectedOutcomes(stance, intervention);
  if (expectedOutcomes.length > 0) signals.push("expected_outcomes");

  return {
    stance,
    signals: unique(signals) as SupportPlanningEvidenceCode[],
    prioritizedActions,
    expectedOutcomes,
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: {
      intervention,
      familyEngagement,
      studentSuccess,
    },
  };
}

function buildPrioritizedActions(input: {
  stance: SupportPlanStance;
  intervention?: UpstreamSlice;
  familyEngagement?: UpstreamSlice;
}): string[] {
  const actions: string[] = [];
  if (input.stance === "intensive_support") {
    actions.push("Activate coordinated intervention plan");
    actions.push("Schedule MTSS / student services review");
    actions.push("Align urgent family outreach");
  } else if (input.stance === "targeted_support") {
    actions.push("Prioritize indicated intervention candidate(s)");
    actions.push("Schedule support review with advisor");
    if (input.familyEngagement) {
      actions.push("Align family outreach with support goals");
    }
  } else if (input.stance === "family_led_partnership") {
    actions.push("Lead with family partnership actions");
    actions.push("Share support brief with family");
  } else {
    actions.push("Maintain support watch cadence");
    actions.push("Publish light-touch support plan");
  }

  for (const kind of input.intervention?.recommendationKinds ?? []) {
    actions.push(`Honor intervention recommendation: ${kind}`);
  }
  for (const kind of input.familyEngagement?.recommendationKinds ?? []) {
    actions.push(`Honor family engagement recommendation: ${kind}`);
  }

  return unique(actions).slice(0, 8);
}

function buildExpectedOutcomes(
  stance: SupportPlanStance,
  intervention?: UpstreamSlice
): string[] {
  const outcomes: string[] = [];
  switch (stance) {
    case "intensive_support":
      outcomes.push("Reduce multi-domain risk within the MTSS cycle");
      outcomes.push("Stabilize attendance and/or academic trajectory");
      break;
    case "targeted_support":
      outcomes.push("Address the dominant support domain with measurable progress");
      break;
    case "family_led_partnership":
      outcomes.push("Increase productive family partnership and shared accountability");
      break;
    case "monitor_and_maintain":
      outcomes.push("Sustain current gains with light monitoring");
      break;
    default:
      break;
  }
  if (hasAny(intervention, ["expected_impact_bound"])) {
    outcomes.push("Realize expected impacts declared by Intervention Intelligence");
  }
  return unique(outcomes);
}

function sliceUpstream(
  contributorId: string,
  result?: EducationContributorResult
): UpstreamSlice | undefined {
  if (!result) return undefined;
  const evidenceCodes = result.evidence
    .map((e) =>
      typeof e.attributes?.code === "string" ? e.attributes.code : ""
    )
    .filter(Boolean);
  return {
    contributorId,
    readiness: result.readiness,
    confidence: result.confidence,
    priority: result.priority,
    blockingCount: result.blockingIssues.length,
    warningCount: result.warnings.length,
    recommendationKinds: result.recommendations.map((r) => r.kind),
    evidenceCodes,
  };
}

function hasAny(
  slice: UpstreamSlice | undefined,
  codes: readonly string[]
): boolean {
  if (!slice) return false;
  return codes.some((c) => slice.evidenceCodes.includes(c));
}

function hasRec(
  slice: UpstreamSlice | undefined,
  fragment: string
): boolean {
  if (!slice) return false;
  return slice.recommendationKinds.some((k) => k.includes(fragment));
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.interventions,
    entityIds: [
      EDUCATION_ENTITY_IDS.student,
      EDUCATION_ENTITY_IDS.intervention,
      EDUCATION_ENTITY_IDS.family,
      EDUCATION_ENTITY_IDS.goal,
    ],
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
