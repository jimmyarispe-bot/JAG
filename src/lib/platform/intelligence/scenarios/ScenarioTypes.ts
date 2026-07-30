/**
 * Scenario Planning Engine — Sprint 202.
 * Advisory hypothetical projections. Never certainty.
 * Application / contributor extension — does not modify Core or Runtime.
 */

export const SCENARIO_KINDS = [
  "enrollment_growth",
  "enrollment_decline",
  "teacher_hiring",
  "teacher_loss",
  "funding_increase",
  "funding_reduction",
  "budget_reallocation",
  "open_new_campus",
  "close_program",
  "compliance_change",
  "custom",
] as const;

export type ScenarioKind = (typeof SCENARIO_KINDS)[number];

export const SCENARIO_KIND_LABELS: Record<ScenarioKind, string> = {
  enrollment_growth: "Enrollment Growth",
  enrollment_decline: "Enrollment Decline",
  teacher_hiring: "Teacher Hiring",
  teacher_loss: "Teacher Loss",
  funding_increase: "Funding Increase",
  funding_reduction: "Funding Reduction",
  budget_reallocation: "Budget Reallocation",
  open_new_campus: "Open New Campus",
  close_program: "Close Program",
  compliance_change: "Compliance Change",
  custom: "Custom Scenario",
};

/** Structured scenario inputs — future extensible. */
export type ScenarioInputs = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly domainId?: string;
  readonly domainName?: string;
  /** Enrollment delta as percent (e.g. 10 = +10%). */
  readonly enrollmentPercent?: number;
  /** Absolute headcount / staff delta. */
  readonly headcount?: number;
  readonly staffCount?: number;
  /** Funding delta in dollars. */
  readonly fundingDollars?: number;
  /** Capacity utilization delta 0–1 or percent points. */
  readonly capacity?: number;
  /** Timeline in days for the scenario to take effect. */
  readonly timelineDays?: number;
  /** Free-form label for custom scenarios. */
  readonly customLabel?: string;
  /** Optional notes from the executive. */
  readonly notes?: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
};

export type ScenarioBaselineSignal = {
  readonly id: string;
  readonly contributorId: string;
  readonly label: string;
  readonly confidence: number;
  readonly summary: string;
  readonly score?: number;
  readonly readiness?: string;
  readonly warnings: readonly string[];
  readonly blockingIssues: readonly string[];
};

export type ScenarioBaseline = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly capturedAt: string;
  readonly signals: readonly ScenarioBaselineSignal[];
  readonly openDecisionCount: number;
  readonly healthScore?: number;
  readonly healthStance?: string;
};

export type ScenarioStance =
  | "favorable"
  | "watch"
  | "at_risk"
  | "critical"
  | "insufficient";

export type ScenarioImpactDimension =
  | "organization_health"
  | "operational_readiness"
  | "staffing_capacity"
  | "funding_readiness"
  | "student_success"
  | "enrollment"
  | "compliance_risk"
  | "decision_pressure"
  | "goal_progress"
  | "mission_alignment";
