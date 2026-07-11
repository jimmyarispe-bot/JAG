/**
 * Goal Execution Engine — shared contracts (Sprint 011).
 *
 * Extends Strategic Intelligence with durable goal/objective/initiative/task
 * execution. No database, UI, or external services — persistence via DI.
 */

import type { SharedIntelligenceContext } from "@/lib/platform/intelligence/context/builder";
import type {
  StrategicGoal,
  StrategicInitiative,
  StrategicIntelligenceResult,
  StrategicObjective,
  StrategicOwners,
} from "@/lib/platform/intelligence/domains/strategic/types";
import type {
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Semantic version of the Goal Execution Engine. */
export const GOAL_EXECUTION_ENGINE_VERSION = "0.1.0";

/** Opaque metadata bag — never use `any`. */
export type GoalExecutionMetadata = IntelligenceMetadata;

/** Workflow states for goals, initiatives, milestones, and tasks. */
export const GOAL_EXECUTION_WORKFLOW_STATUSES = [
  "draft",
  "approved",
  "planning",
  "active",
  "on_track",
  "at_risk",
  "behind",
  "blocked",
  "completed",
  "cancelled",
] as const;
export type GoalExecutionWorkflowStatus =
  (typeof GOAL_EXECUTION_WORKFLOW_STATUSES)[number];

/** Priority levels. */
export const GOAL_EXECUTION_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type GoalExecutionPriority = (typeof GOAL_EXECUTION_PRIORITIES)[number];

/** Entity kinds participating in dependency graphs. */
export const GOAL_EXECUTION_ENTITY_KINDS = [
  "goal",
  "objective",
  "initiative",
  "milestone",
  "task",
] as const;
export type GoalExecutionEntityKind = (typeof GOAL_EXECUTION_ENTITY_KINDS)[number];

/** Dependency relationship kinds. */
export const GOAL_EXECUTION_DEPENDENCY_KINDS = [
  "blocks",
  "requires",
  "contributes_to",
  "measures",
  "owns",
] as const;
export type GoalExecutionDependencyKind =
  (typeof GOAL_EXECUTION_DEPENDENCY_KINDS)[number];

/** Health labels derived from progress. */
export const GOAL_EXECUTION_HEALTH_LABELS = [
  "healthy",
  "watch",
  "at_risk",
  "critical",
] as const;
export type GoalExecutionHealthLabel = (typeof GOAL_EXECUTION_HEALTH_LABELS)[number];

/** Adjustment feedback sources. */
export const GOAL_EXECUTION_FEEDBACK_SOURCES = [
  "user",
  "kpi",
  "strategic_intelligence",
  "executive_intelligence",
  "support_intelligence",
  "system",
] as const;
export type GoalExecutionFeedbackSource =
  (typeof GOAL_EXECUTION_FEEDBACK_SOURCES)[number];

/** Notification kinds. */
export const GOAL_EXECUTION_NOTIFICATION_KINDS = [
  "overdue",
  "risk",
  "milestone",
  "completion",
] as const;
export type GoalExecutionNotificationKind =
  (typeof GOAL_EXECUTION_NOTIFICATION_KINDS)[number];

/** Impact dimensions (aligned with Strategic Intelligence). */
export const GOAL_EXECUTION_IMPACT_DIMENSIONS = [
  "financial",
  "operational",
  "academic",
  "mission",
  "employee",
  "customer",
  "community",
] as const;
export type GoalExecutionImpactDimension =
  (typeof GOAL_EXECUTION_IMPACT_DIMENSIONS)[number];

/** Executable strategic goal managed by the engine. */
export interface ExecutionGoal {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: GoalExecutionPriority;
  readonly status: GoalExecutionWorkflowStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly targetDate: string;
  readonly expectedValue: string;
  readonly confidence: IntelligenceConfidenceScore;
  readonly linkedOpportunityIds: readonly string[];
  readonly strategicGoalId: string | null;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly archived: boolean;
  readonly metadata: GoalExecutionMetadata;
}

/** Measurable objective. */
export interface ExecutionObjective {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly description: string;
  readonly baseline: number;
  readonly target: number;
  readonly currentValue: number;
  readonly measurementMethod: string;
  readonly frequency: string;
  readonly successCriteria: string;
  readonly status: GoalExecutionWorkflowStatus;
  readonly strategicObjectiveId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Executable initiative. */
export interface ExecutionInitiative {
  readonly id: string;
  readonly goalId: string;
  readonly objectiveIds: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly status: GoalExecutionWorkflowStatus;
  readonly budgetAmount: number;
  readonly budgetCurrency: string;
  readonly budgetSpent: number;
  readonly resources: readonly string[];
  readonly startDate: string;
  readonly endDate: string;
  readonly strategicInitiativeId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Milestone within an initiative. */
export interface ExecutionMilestone {
  readonly id: string;
  readonly initiativeId: string;
  readonly title: string;
  readonly dueDate: string;
  readonly status: GoalExecutionWorkflowStatus;
  readonly completionPercent: number;
  readonly strategicMilestoneId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Executable work item. */
export interface ExecutionTask {
  readonly id: string;
  readonly initiativeId: string;
  readonly milestoneId: string | null;
  readonly goalId: string;
  readonly title: string;
  readonly description: string;
  readonly owner: string;
  readonly dueDate: string;
  readonly priority: GoalExecutionPriority;
  readonly dependencyIds: readonly string[];
  readonly completionPercent: number;
  readonly evidence: readonly IntelligenceEvidenceRef[];
  readonly notes: readonly string[];
  readonly status: GoalExecutionWorkflowStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Ownership assignment. */
export interface ExecutionOwners {
  readonly subjectKind: GoalExecutionEntityKind;
  readonly subjectId: string;
  readonly primaryOwner: string;
  readonly executiveSponsor: string;
  readonly supportingTeam: readonly string[];
  readonly approver: string;
  readonly updatedAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Directed dependency edge. */
export interface ExecutionDependency {
  readonly id: string;
  readonly kind: GoalExecutionDependencyKind;
  readonly fromKind: GoalExecutionEntityKind;
  readonly fromId: string;
  readonly toKind: GoalExecutionEntityKind;
  readonly toId: string;
  readonly createdAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Progress / health / velocity snapshot. */
export interface ExecutionProgressSnapshot {
  readonly subjectKind: GoalExecutionEntityKind;
  readonly subjectId: string;
  readonly completionPercent: number;
  readonly healthScore: number;
  readonly healthLabel: GoalExecutionHealthLabel;
  readonly riskScore: number;
  readonly velocity: number;
  readonly forecastCompletionDate: string | null;
  readonly calculatedAt: string;
  readonly notes: readonly string[];
  readonly metadata: GoalExecutionMetadata;
}

/** Course correction recommendation. */
export interface ExecutionAdjustment {
  readonly id: string;
  readonly subjectKind: GoalExecutionEntityKind;
  readonly subjectId: string;
  readonly source: GoalExecutionFeedbackSource;
  readonly summary: string;
  readonly recommendedActions: readonly string[];
  readonly urgency: GoalExecutionPriority;
  readonly confidence: IntelligenceConfidenceScore;
  readonly createdAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Feedback accepted by the adjustments engine. */
export interface ExecutionFeedbackInput {
  readonly subjectKind: GoalExecutionEntityKind;
  readonly subjectId: string;
  readonly source: GoalExecutionFeedbackSource;
  readonly message: string;
  readonly kpiKey?: string;
  readonly kpiValue?: number;
  readonly metadata?: GoalExecutionMetadata;
}

/** Executive scorecard. */
export interface ExecutionScorecard {
  readonly scorecardId: string;
  readonly goalId: string;
  readonly progressPercent: number;
  readonly riskScore: number;
  readonly budgetUtilizationPercent: number;
  readonly timelineAdherencePercent: number;
  readonly ownerAccountabilityScore: number;
  readonly confidence: IntelligenceConfidenceScore;
  readonly healthLabel: GoalExecutionHealthLabel;
  readonly summary: string;
  readonly generatedAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Actual impact score. */
export interface ExecutionImpactScore {
  readonly dimension: GoalExecutionImpactDimension;
  readonly planned: number;
  readonly actual: number;
  readonly delta: number;
  readonly rationale: string;
}

/** Aggregated impact assessment. */
export interface ExecutionImpactAssessment {
  readonly goalId: string;
  readonly scores: readonly ExecutionImpactScore[];
  readonly overallActual: number;
  readonly overallPlanned: number;
  readonly summary: string;
  readonly assessedAt: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Execution notification / alert. */
export interface ExecutionNotification {
  readonly id: string;
  readonly kind: GoalExecutionNotificationKind;
  readonly subjectKind: GoalExecutionEntityKind;
  readonly subjectId: string;
  readonly title: string;
  readonly message: string;
  readonly severity: GoalExecutionPriority;
  readonly createdAt: string;
  readonly acknowledged: boolean;
  readonly metadata: GoalExecutionMetadata;
}

/** Strongly typed dashboard model for future UI. */
export interface ExecutionDashboardModel {
  readonly dashboardId: string;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly generatedAt: string;
  readonly goals: readonly ExecutionGoal[];
  readonly objectives: readonly ExecutionObjective[];
  readonly initiatives: readonly ExecutionInitiative[];
  readonly milestones: readonly ExecutionMilestone[];
  readonly tasks: readonly ExecutionTask[];
  readonly scorecards: readonly ExecutionScorecard[];
  readonly notifications: readonly ExecutionNotification[];
  readonly progress: readonly ExecutionProgressSnapshot[];
  readonly adjustments: readonly ExecutionAdjustment[];
  readonly impact: readonly ExecutionImpactAssessment[];
  readonly summary: {
    readonly activeGoals: number;
    readonly atRiskItems: number;
    readonly overdueTasks: number;
    readonly averageCompletion: number;
    readonly averageHealth: number;
  };
  readonly metadata: GoalExecutionMetadata;
}

/** Executive execution report. */
export interface ExecutionReport {
  readonly reportId: string;
  readonly title: string;
  readonly generatedAt: string;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly executiveSummary: string;
  readonly goalSummaries: readonly string[];
  readonly riskHighlights: readonly string[];
  readonly progressHighlights: readonly string[];
  readonly recommendedActions: readonly string[];
  readonly scorecards: readonly ExecutionScorecard[];
  readonly impact: readonly ExecutionImpactAssessment[];
  readonly narrative: string;
  readonly metadata: GoalExecutionMetadata;
}

/** Optional integration inputs when bootstrapping from Intelligence. */
export interface GoalExecutionIntegrationInput {
  readonly strategic?: StrategicIntelligenceResult;
  readonly strategicGoals?: readonly StrategicGoal[];
  readonly strategicObjectives?: readonly StrategicObjective[];
  readonly strategicInitiatives?: readonly StrategicInitiative[];
  readonly strategicOwners?: StrategicOwners;
  readonly sharedContext?: SharedIntelligenceContext;
  readonly organizationId?: string | null;
  readonly schoolId?: string | null;
  readonly metadata?: GoalExecutionMetadata;
}

/** Default confidence when none is supplied. */
export const DEFAULT_EXECUTION_CONFIDENCE: IntelligenceConfidenceScore = {
  value: 0.5,
  level: "medium",
  factors: [],
};
