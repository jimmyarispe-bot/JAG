/**
 * Organizational Memory — Sprint 204.
 * Institutional experience, not chat history.
 * Application / intelligence extension — does not modify Core or Runtime.
 */

export const MEMORY_TYPES = [
  "decision",
  "execution",
  "outcome",
  "forecast",
  "scenario",
  "executive_note",
  "lesson_learned",
  "risk_event",
  "opportunity",
  "milestone",
  "custom",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  decision: "Decision",
  execution: "Execution",
  outcome: "Outcome",
  forecast: "Forecast",
  scenario: "Scenario",
  executive_note: "Executive Note",
  lesson_learned: "Lesson Learned",
  risk_event: "Risk Event",
  opportunity: "Opportunity",
  milestone: "Milestone",
  custom: "Custom",
};

export type MemoryOutcomeKind =
  | "success"
  | "failure"
  | "mixed"
  | "pending"
  | "unknown";

export type MemoryEvidenceRef = {
  readonly id: string;
  readonly source: string;
  readonly summary: string;
};

export type MemoryLesson = {
  readonly whatWorked: readonly string[];
  readonly whatFailed: readonly string[];
  readonly unexpectedOutcomes: readonly string[];
  readonly recommendations: readonly string[];
};

export type MemoryRecord = {
  readonly id: string;
  readonly type: MemoryType;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly date: string;
  readonly title: string;
  readonly description: string;
  readonly evidence: readonly MemoryEvidenceRef[];
  readonly outcome: MemoryOutcomeKind;
  readonly outcomeSummary?: string;
  readonly confidence: number;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedForecastIds: readonly string[];
  readonly relatedScenarioIds: readonly string[];
  readonly relatedContributorIds: readonly string[];
  readonly relatedPolicyIds: readonly string[];
  readonly relatedGoalIds: readonly string[];
  readonly tags: readonly string[];
  readonly lesson?: MemoryLesson;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly advisoryNotice: string;
};

export type MemoryCreateInput = {
  readonly type: MemoryType;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly date?: string;
  readonly title: string;
  readonly description: string;
  readonly evidence?: readonly MemoryEvidenceRef[];
  readonly outcome?: MemoryOutcomeKind;
  readonly outcomeSummary?: string;
  readonly confidence?: number;
  readonly relatedDecisionIds?: readonly string[];
  readonly relatedForecastIds?: readonly string[];
  readonly relatedScenarioIds?: readonly string[];
  readonly relatedContributorIds?: readonly string[];
  readonly relatedPolicyIds?: readonly string[];
  readonly relatedGoalIds?: readonly string[];
  readonly tags?: readonly string[];
  readonly lesson?: MemoryLesson;
  readonly createdBy: string;
};
