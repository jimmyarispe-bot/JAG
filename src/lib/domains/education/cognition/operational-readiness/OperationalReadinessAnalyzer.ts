import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
} from "../../knowledge";
import type { EducationContributorResult } from "../framework";
import {
  countOperationalUpstream,
  type OperationalReadinessInputs,
} from "./OperationalReadinessInputs";
import type {
  OperationalReadinessEvidenceCode,
  OperationalReadinessStance,
} from "./OperationalReadinessTypes";

export interface UpstreamSlice {
  contributorId: string;
  readiness: EducationContributorResult["readiness"];
  confidence: number;
  evidenceCodes: readonly string[];
  recommendationKinds: readonly string[];
  blockingCount: number;
  warningCount: number;
}

export interface OperationalReadinessAnalysis {
  stance: OperationalReadinessStance;
  readinessScore: number;
  signals: OperationalReadinessEvidenceCode[];
  risks: string[];
  strengths: string[];
  recommendedActions: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
  };
  upstreamSummary: {
    scheduling?: UpstreamSlice;
    staffing?: UpstreamSlice;
    capacity?: UpstreamSlice;
  };
}

export function validateOperationalReadinessInputs(
  inputs: OperationalReadinessInputs
): void {
  if (!inputs.subjectId?.trim()) {
    throw new Error("Operational readiness inputs require subjectId");
  }
}

export function analyzeOperationalReadiness(
  inputs: OperationalReadinessInputs
): OperationalReadinessAnalysis {
  const scheduling = slice("education.cognition.scheduling", inputs.scheduling);
  const staffing = slice("education.cognition.staffing", inputs.staffing);
  const capacity = slice("education.cognition.capacity", inputs.capacity);

  if (countOperationalUpstream(inputs) === 0) {
    return {
      stance: "insufficient",
      readinessScore: 0,
      signals: ["insufficient_upstream", "synthesis_inputs_bound"],
      risks: ["No upstream operations contributor results"],
      strengths: [],
      recommendedActions: [],
      knowledgeRefs: knowledgeRefs(),
      upstreamSummary: {},
    };
  }

  const signals: OperationalReadinessEvidenceCode[] = ["synthesis_inputs_bound"];
  if (scheduling) signals.push("upstream_scheduling");
  if (staffing) signals.push("upstream_staffing");
  if (capacity) signals.push("upstream_capacity");
  if (inputs.policyResult && inputs.policyResult.evaluations.length > 0) {
    signals.push("policy_signals_present");
  }

  const risks: string[] = [];
  const strengths: string[] = [];
  const present = [scheduling, staffing, capacity].filter(Boolean) as UpstreamSlice[];

  for (const p of present) {
    if (p.readiness === "blocked" || p.blockingCount > 0) {
      risks.push(`${p.contributorId}: blocked`);
    } else if (p.readiness === "conditional" || p.warningCount > 0) {
      risks.push(`${p.contributorId}: conditional/warnings`);
    } else if (p.readiness === "ready") {
      strengths.push(`${p.contributorId}: ready`);
    }
  }

  const hasConflict = hasCode(scheduling, "schedule_conflict");
  const hasCoverageGap = hasCode(scheduling, "coverage_gap");
  const hasOverload = hasCode(staffing, "teacher_overload");
  const hasQualGap = hasCode(staffing, "qualification_gap");
  const hasOverCap = hasCode(capacity, "over_capacity");
  const healthySchedule = hasCode(scheduling, "schedule_healthy");
  const healthyStaff = hasCode(staffing, "coverage_ok") || hasCode(staffing, "load_balanced");
  const healthyCap = hasCode(capacity, "capacity_healthy");

  if (hasConflict) risks.push("Schedule conflicts present");
  if (hasCoverageGap) risks.push("Instructional coverage gaps");
  if (hasOverload) risks.push("Teacher overload");
  if (hasQualGap) risks.push("Qualification gaps");
  if (hasOverCap) risks.push("Over-capacity sections");
  if (hasCode(capacity, "under_utilized")) {
    risks.push("Under-utilized capacity");
  }
  if (healthySchedule) strengths.push("Healthy schedule");
  if (healthyStaff) strengths.push("Healthy staffing");
  if (healthyCap) strengths.push("Healthy capacity");

  const hardRisk =
    hasConflict || hasOverload || hasOverCap || present.some((p) => p.readiness === "blocked");
  const softRisk =
    hasCoverageGap || hasQualGap || present.some((p) => p.readiness === "conditional");

  let stance: OperationalReadinessStance = "ready";
  if (hardRisk) {
    stance = "blocked";
    signals.push("ops_blocked", "ops_risks");
  } else if (softRisk || risks.length > strengths.length) {
    stance = "at_risk";
    signals.push("ops_at_risk", "ops_risks");
  } else {
    stance = "ready";
    signals.push("ops_ready");
  }
  if (strengths.length > 0) signals.push("ops_strengths");

  const readinessScore = computeScore(present, hardRisk, softRisk, strengths.length);
  signals.push("readiness_score");

  const recommendedActions = buildActions(stance, {
    hasConflict,
    hasCoverageGap,
    hasOverload,
    hasOverCap,
  });

  return {
    stance,
    readinessScore,
    signals: [...new Set(signals)],
    risks: [...new Set(risks)],
    strengths: [...new Set(strengths)],
    recommendedActions,
    knowledgeRefs: knowledgeRefs(),
    upstreamSummary: { scheduling, staffing, capacity },
  };
}

function computeScore(
  present: UpstreamSlice[],
  hardRisk: boolean,
  softRisk: boolean,
  strengthCount: number
): number {
  if (present.length === 0) return 0;
  const avgConfidence =
    present.reduce((n, p) => n + p.confidence, 0) / present.length;
  let score = avgConfidence * 100;
  if (hardRisk) score -= 40;
  else if (softRisk) score -= 20;
  score += Math.min(15, strengthCount * 5);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildActions(
  stance: OperationalReadinessStance,
  flags: {
    hasConflict: boolean;
    hasCoverageGap: boolean;
    hasOverload: boolean;
    hasOverCap: boolean;
  }
): string[] {
  const actions: string[] = [];
  if (stance === "blocked" || stance === "at_risk") {
    actions.push("Stabilize operations before semester commitments");
  }
  if (flags.hasConflict) actions.push("Resolve schedule conflicts");
  if (flags.hasCoverageGap) actions.push("Fill instructional coverage gaps");
  if (flags.hasOverload) actions.push("Rebalance teacher load");
  if (flags.hasOverCap) actions.push("Address over-capacity sections");
  if (stance === "ready") actions.push("Publish leadership operations brief");
  return actions;
}

function slice(
  contributorId: string,
  result?: EducationContributorResult
): UpstreamSlice | undefined {
  if (!result) return undefined;
  return {
    contributorId,
    readiness: result.readiness,
    confidence: result.confidence,
    evidenceCodes: result.evidence
      .map((e) =>
        typeof e.attributes?.code === "string" ? e.attributes.code : ""
      )
      .filter(Boolean),
    recommendationKinds: result.recommendations.map((r) => r.kind),
    blockingCount: result.blockingIssues.length,
    warningCount: result.warnings.length,
  };
}

function hasCode(slice: UpstreamSlice | undefined, code: string): boolean {
  return Boolean(slice?.evidenceCodes.includes(code));
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.operationalReadiness,
    entityIds: [
      EDUCATION_ENTITY_IDS.section,
      EDUCATION_ENTITY_IDS.teachingAssignment,
      EDUCATION_ENTITY_IDS.capacityUnit,
      EDUCATION_ENTITY_IDS.campus,
    ],
  };
}
