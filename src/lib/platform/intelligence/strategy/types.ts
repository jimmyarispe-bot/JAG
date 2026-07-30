/**
 * Strategic Intelligence — Sprint 205.
 * Application / intelligence extension — does not modify Core or Runtime.
 */

export const STRATEGIC_PILLAR_KINDS = [
  "student_outcomes",
  "family_experience",
  "financial_sustainability",
  "team_excellence",
  "innovation",
  "operational_excellence",
  "compliance",
  "custom",
] as const;

export type StrategicPillarKind = (typeof STRATEGIC_PILLAR_KINDS)[number];

export const STRATEGIC_PILLAR_LABELS: Record<StrategicPillarKind, string> = {
  student_outcomes: "Student Outcomes",
  family_experience: "Family Experience",
  financial_sustainability: "Financial Sustainability",
  team_excellence: "Team Excellence",
  innovation: "Innovation",
  operational_excellence: "Operational Excellence",
  compliance: "Compliance",
  custom: "Custom",
};

export const GOAL_STATUSES = [
  "proposed",
  "active",
  "at_risk",
  "blocked",
  "completed",
  "deferred",
] as const;

export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export const GOAL_HEALTH_LEVELS = [
  "on_track",
  "watch",
  "at_risk",
  "blocked",
  "achieved",
  "unknown",
] as const;

export type GoalHealthLevel = (typeof GOAL_HEALTH_LEVELS)[number];

export const INITIATIVE_STATUSES = [
  "planned",
  "active",
  "behind",
  "blocked",
  "completed",
  "cancelled",
] as const;

export type InitiativeStatus = (typeof INITIATIVE_STATUSES)[number];

export const ALIGNMENT_IMPACTS = ["positive", "negative", "unknown"] as const;
export type AlignmentImpact = (typeof ALIGNMENT_IMPACTS)[number];

export type StrategyEvidenceRef = {
  readonly id: string;
  readonly source: string;
  readonly summary: string;
};

export type OrganizationalMission = {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly mission: string;
  readonly vision: string;
  readonly coreValues: readonly string[];
  readonly planningHorizon: string;
  readonly reviewCadence: string;
  readonly nextReviewAt: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
};

export type StrategicPillar = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: StrategicPillarKind;
  readonly label: string;
  readonly description: string;
  readonly sortOrder: number;
  readonly active: boolean;
};

export type StrategicGoal = {
  readonly id: string;
  readonly organizationId: string;
  readonly pillarId: string;
  readonly title: string;
  readonly description: string;
  readonly owner: string;
  readonly priority: GoalPriority;
  readonly status: GoalStatus;
  readonly progress: number;
  readonly health: GoalHealthLevel;
  readonly confidence: number;
  readonly targetDate: string;
  readonly evidence: readonly StrategyEvidenceRef[];
  readonly relatedForecastIds: readonly string[];
  readonly relatedScenarioIds: readonly string[];
  readonly relatedDecisionIds: readonly string[];
  readonly relatedOutcomeIds: readonly string[];
  readonly relatedMemoryIds: readonly string[];
  readonly programIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type StrategicInitiative = {
  readonly id: string;
  readonly organizationId: string;
  readonly goalId: string;
  readonly title: string;
  readonly description: string;
  readonly owner: string;
  readonly status: InitiativeStatus;
  readonly progress: number;
  readonly impactScore: number;
  readonly targetDate: string;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedExecutionIds: readonly string[];
  readonly relatedOutcomeIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type DecisionStrategicAlignment = {
  readonly decisionId: string;
  readonly organizationId: string;
  readonly goalIds: readonly string[];
  readonly pillarIds: readonly string[];
  readonly missionAlignment: number;
  readonly impact: AlignmentImpact;
  readonly rationale: string;
  readonly confidence: number;
};
