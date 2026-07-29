/**
 * Predictive Intelligence Engine — Sprint 201.
 * Advisory forecasts only. Never present as facts.
 * Application / contributor extension — does not modify Core or Runtime.
 */

export const PREDICTION_KINDS = [
  "organization_health",
  "student_success",
  "operational_readiness",
  "funding_readiness",
  "decision_queue_growth",
  "staffing_capacity",
  "enrollment_trend",
  "compliance_risk",
] as const;

export type PredictionKind = (typeof PREDICTION_KINDS)[number];

export const PREDICTION_KIND_LABELS: Record<PredictionKind, string> = {
  organization_health: "Organization Health",
  student_success: "Student Success",
  operational_readiness: "Operational Readiness",
  funding_readiness: "Funding Readiness",
  decision_queue_growth: "Decision Queue Growth",
  staffing_capacity: "Staffing Capacity",
  enrollment_trend: "Enrollment Trend",
  compliance_risk: "Compliance Risk",
};

export type PredictionTrend = "improving" | "stable" | "declining" | "unknown";

export type PredictionRiskLevel = "low" | "moderate" | "elevated" | "critical" | "unknown";

export type PredictionStance =
  | "favorable"
  | "watch"
  | "at_risk"
  | "critical"
  | "insufficient";

/** Portable signal snapshot — callers bind contributor outputs here. */
export type PredictionSignal = {
  readonly id: string;
  readonly contributorId: string;
  readonly label: string;
  readonly readiness?: string;
  readonly confidence: number;
  readonly summary: string;
  readonly warnings: readonly string[];
  readonly blockingIssues: readonly string[];
  readonly analyzedAt: string;
  /** Optional numeric score 0–1 when available (e.g. health score). */
  readonly score?: number;
  readonly attributes?: Readonly<Record<string, unknown>>;
};

export type PredictionContext = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly capturedAt: string;
  readonly signals: readonly PredictionSignal[];
  readonly openDecisionCount: number;
  readonly overdueDecisionCount: number;
  readonly p1DecisionCount: number;
  readonly completedDecisionCount: number;
};
