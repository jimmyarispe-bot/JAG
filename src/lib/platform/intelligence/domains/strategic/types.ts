/**
 * Strategic Intelligence domain — shared types.
 *
 * Converts intelligence findings into goals, objectives, initiatives,
 * ownership, execution tracking, impact, and executive briefs.
 * Tenant-agnostic; no database, UI, or external services.
 */

import type {
  IntelligenceCasePriority,
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Semantic version of the Strategic Intelligence domain pack. */
export const STRATEGIC_INTELLIGENCE_VERSION = "0.1.0";

/** Strategic opportunity kinds derived from intelligence findings. */
export const STRATEGIC_OPPORTUNITY_KINDS = [
  "organizational_risk",
  "growth_opportunity",
  "mission_opportunity",
  "operational_weakness",
  "financial_weakness",
  "compliance_risk",
  "staffing_issue",
  "customer_experience_issue",
] as const;
export type StrategicOpportunityKind = (typeof STRATEGIC_OPPORTUNITY_KINDS)[number];

/** Goal priority levels. */
export const STRATEGIC_GOAL_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type StrategicGoalPriority = (typeof STRATEGIC_GOAL_PRIORITIES)[number];

/** Goal lifecycle statuses. */
export const STRATEGIC_GOAL_STATUSES = [
  "draft",
  "proposed",
  "approved",
  "active",
  "completed",
  "cancelled",
] as const;
export type StrategicGoalStatus = (typeof STRATEGIC_GOAL_STATUSES)[number];

/** Objective measurement frequency. */
export const STRATEGIC_MEASUREMENT_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
] as const;
export type StrategicMeasurementFrequency =
  (typeof STRATEGIC_MEASUREMENT_FREQUENCIES)[number];

/** Initiative / execution statuses. */
export const STRATEGIC_EXECUTION_STATUSES = [
  "planning",
  "active",
  "on_track",
  "behind",
  "blocked",
  "completed",
  "cancelled",
] as const;
export type StrategicExecutionStatus = (typeof STRATEGIC_EXECUTION_STATUSES)[number];

/** Impact dimensions measured by Strategic Intelligence. */
export const STRATEGIC_IMPACT_DIMENSIONS = [
  "financial",
  "operational",
  "academic",
  "mission",
  "customer",
  "community",
  "employee",
  "compliance",
] as const;
export type StrategicImpactDimension = (typeof STRATEGIC_IMPACT_DIMENSIONS)[number];

/** Recommendation urgency. */
export const STRATEGIC_URGENCY_LEVELS = ["immediate", "near_term", "planned", "watch"] as const;
export type StrategicUrgency = (typeof STRATEGIC_URGENCY_LEVELS)[number];

/** Opaque metadata — never use `any`. */
export type StrategicMetadata = IntelligenceMetadata;

/** Normalized finding supplied to Strategic Intelligence. */
export interface StrategicFindingInput {
  findingId: string;
  title: string;
  summary: string;
  severity?: StrategicGoalPriority;
  kindHints?: StrategicOpportunityKind[];
  evidenceRefs?: IntelligenceEvidenceRef[];
  confidence?: IntelligenceConfidenceScore;
  signals?: string[];
  metadata?: StrategicMetadata;
}

/** Strategic Intelligence request. */
export interface StrategicRequest {
  requestId: string;
  subject: string;
  description?: string;
  findings?: StrategicFindingInput[];
  organizationId?: string | null;
  schoolId?: string | null;
  metadata?: StrategicMetadata;
}

/** Strategic opportunity derived from a finding. */
export interface StrategicOpportunity {
  opportunityId: string;
  kind: StrategicOpportunityKind;
  title: string;
  description: string;
  priority: StrategicGoalPriority;
  sourceFindingId: string;
  confidence: IntelligenceConfidenceScore;
  evidenceRefs: IntelligenceEvidenceRef[];
  metadata?: StrategicMetadata;
}

/** Analysis package of strategic opportunities. */
export interface StrategicAnalysisResult {
  requestId: string;
  opportunities: StrategicOpportunity[];
  primaryOpportunity: StrategicOpportunity | null;
  summary: string;
  metadata?: StrategicMetadata;
}

/** Strategic goal. */
export interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  priority: StrategicGoalPriority;
  status: StrategicGoalStatus;
  createdDate: string;
  targetDate: string;
  expectedValue: string;
  confidence: IntelligenceConfidenceScore;
  linkedOpportunities: string[];
  metadata?: StrategicMetadata;
}

/** Measurable strategic objective. */
export interface StrategicObjective {
  id: string;
  goalId: string;
  title: string;
  description: string;
  baseline: number;
  target: number;
  currentValue: number;
  measurementMethod: string;
  frequency: StrategicMeasurementFrequency;
  successCriteria: string;
  metadata?: StrategicMetadata;
}

/** Initiative milestone. */
export interface StrategicMilestone {
  milestoneId: string;
  title: string;
  dueDate: string;
  status: StrategicExecutionStatus;
  metadata?: StrategicMetadata;
}

/** Executable strategic initiative. */
export interface StrategicInitiative {
  id: string;
  goalId: string;
  objectiveIds: string[];
  title: string;
  description: string;
  dependencies: string[];
  milestones: StrategicMilestone[];
  budget: {
    amount: number;
    currency: string;
    notes?: string;
  };
  resources: string[];
  timeline: {
    startDate: string;
    endDate: string;
  };
  status: StrategicExecutionStatus;
  metadata?: StrategicMetadata;
}

/** Ownership assignment for strategic work. */
export interface StrategicOwners {
  primaryOwner: string;
  executiveSponsor: string;
  supportingTeam: string[];
  approver: string;
  metadata?: StrategicMetadata;
}

/** Execution tracking snapshot. */
export interface StrategicExecutionSnapshot {
  initiativeId: string;
  status: StrategicExecutionStatus;
  healthScore: number;
  healthLabel: "healthy" | "watch" | "at_risk" | "critical";
  progressPercent: number;
  blockers: string[];
  notes: string[];
  updatedAt: string;
  metadata?: StrategicMetadata;
}

/** Strategic recommendation. */
export interface StrategicRecommendation {
  recommendationId: string;
  priority: IntelligenceCasePriority;
  urgency: StrategicUrgency;
  expectedImpact: string;
  recommendedActions: string[];
  confidence: IntelligenceConfidenceScore;
  linkedGoalId?: string;
  linkedOpportunityId?: string;
  metadata?: StrategicMetadata;
}

/** Impact score for a single dimension. */
export interface StrategicImpactScore {
  dimension: StrategicImpactDimension;
  score: number;
  rationale: string;
}

/** Aggregated impact assessment. */
export interface StrategicImpactAssessment {
  scores: StrategicImpactScore[];
  overallScore: number;
  primaryDimensions: StrategicImpactDimension[];
  summary: string;
  metadata?: StrategicMetadata;
}

/** Executive narrative brief sections. */
export interface StrategicBrief {
  briefId: string;
  requestId: string;
  executiveSummary: string;
  situation: string;
  evidence: string[];
  strategicGoal: string;
  objectives: string[];
  owner: string;
  timeline: string;
  expectedImpact: string;
  risks: string[];
  recommendedActions: string[];
  confidence: IntelligenceConfidenceScore;
  narrative: string;
  createdAt: string;
  metadata?: StrategicMetadata;
}

/** Aggregate Strategic Intelligence result. */
export interface StrategicIntelligenceResult {
  requestId: string;
  analysis: StrategicAnalysisResult;
  goals: StrategicGoal[];
  objectives: StrategicObjective[];
  initiatives: StrategicInitiative[];
  owners: StrategicOwners;
  execution: StrategicExecutionSnapshot[];
  recommendations: StrategicRecommendation[];
  impact: StrategicImpactAssessment;
  brief: StrategicBrief;
  domainVersion: string;
  completedAt: string;
  metadata?: StrategicMetadata;
}
