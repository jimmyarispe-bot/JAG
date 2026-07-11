/**
 * Decision Intelligence domain — shared types.
 *
 * Evaluates strategic decisions using shared context, memory, strategic goals,
 * execution status, KPIs, risks, and opportunities.
 * Tenant-agnostic; no database, UI, or external services.
 */

import type { SharedIntelligenceContext } from "@/lib/platform/intelligence/context/builder";
import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";
import type {
  StrategicGoal,
  StrategicIntelligenceResult,
  StrategicOpportunity,
} from "@/lib/platform/intelligence/domains/strategic/types";
import type {
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";
import type {
  ExecutionGoal,
  ExecutionProgressSnapshot,
} from "@/lib/platform/execution/types";

/** Semantic version of the Decision Intelligence domain pack. */
export const DECISION_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type DecisionMetadata = IntelligenceMetadata;

/** Decision priority. */
export const DECISION_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type DecisionPriority = (typeof DECISION_PRIORITIES)[number];

/** Approval / governance statuses. */
export const DECISION_APPROVAL_STATUSES = [
  "draft",
  "under_review",
  "approved",
  "rejected",
  "deferred",
  "implemented",
] as const;
export type DecisionApprovalStatus = (typeof DECISION_APPROVAL_STATUSES)[number];

/** Risk categories. */
export const DECISION_RISK_CATEGORIES = [
  "financial",
  "operational",
  "academic",
  "compliance",
  "staffing",
  "mission",
  "customer",
  "reputation",
] as const;
export type DecisionRiskCategory = (typeof DECISION_RISK_CATEGORIES)[number];

/** Scenario kinds. */
export const DECISION_SCENARIO_KINDS = [
  "best_case",
  "expected_case",
  "worst_case",
  "most_likely",
] as const;
export type DecisionScenarioKind = (typeof DECISION_SCENARIO_KINDS)[number];

/** Impact dimensions. */
export const DECISION_IMPACT_DIMENSIONS = [
  "financial",
  "operational",
  "academic",
  "mission",
  "community",
  "customer",
  "employee",
] as const;
export type DecisionImpactDimension = (typeof DECISION_IMPACT_DIMENSIONS)[number];

/** Evidence source kinds. */
export const DECISION_EVIDENCE_KINDS = [
  "kpi",
  "report",
  "intelligence_finding",
  "historical_decision",
  "execution_result",
  "memory",
  "strategic_goal",
  "shared_context",
] as const;
export type DecisionEvidenceKind = (typeof DECISION_EVIDENCE_KINDS)[number];

/** KPI signal supplied with a decision request. */
export interface DecisionKpiSignal {
  key: string;
  label: string;
  value: number;
  unit?: string;
  target?: number;
  trend?: "up" | "down" | "flat";
  metadata?: DecisionMetadata;
}

/** Normalized Decision Intelligence request. */
export interface DecisionRequest {
  requestId: string;
  subject: string;
  description?: string;
  decisionQuestion?: string;
  organizationId?: string | null;
  schoolId?: string | null;
  kpis?: DecisionKpiSignal[];
  findings?: string[];
  opportunities?: string[];
  risks?: string[];
  /** Optional Shared Intelligence Context. */
  sharedContext?: SharedIntelligenceContext;
  /** Optional Strategic Intelligence package. */
  strategic?: StrategicIntelligenceResult;
  strategicGoals?: StrategicGoal[];
  strategicOpportunities?: StrategicOpportunity[];
  /** Optional Goal Execution snapshots. */
  executionGoals?: ExecutionGoal[];
  executionProgress?: ExecutionProgressSnapshot[];
  /** Optional Persistent Memory records. */
  memories?: IntelligencePersistentMemoryRecord[];
  evidenceRefs?: IntelligenceEvidenceRef[];
  metadata?: DecisionMetadata;
}

/** Collected decision evidence item. */
export interface DecisionEvidenceItem {
  evidenceId: string;
  kind: DecisionEvidenceKind;
  title: string;
  summary: string;
  weight: number;
  sourceRef?: string;
  metadata?: DecisionMetadata;
}

/** Evidence collection result. */
export interface DecisionEvidenceResult {
  requestId: string;
  items: DecisionEvidenceItem[];
  summary: string;
  metadata?: DecisionMetadata;
}

/** Decision analysis framing. */
export interface DecisionAnalysisResult {
  requestId: string;
  decisionQuestion: string;
  contextSummary: string;
  strategicGoalIds: string[];
  executionSignals: string[];
  opportunitySignals: string[];
  riskSignals: string[];
  kpiHighlights: string[];
  memoryHighlights: string[];
  priority: DecisionPriority;
  confidence: IntelligenceConfidenceScore;
  summary: string;
  metadata?: DecisionMetadata;
}

/** A decision alternative / option. */
export interface DecisionAlternative {
  alternativeId: string;
  title: string;
  description: string;
  benefits: string[];
  drawbacks: string[];
  cost: {
    amount: number;
    currency: string;
    notes?: string;
  };
  timelineDays: number;
  confidence: IntelligenceConfidenceScore;
  expectedImpact: string;
  score: number;
  metadata?: DecisionMetadata;
}

/** Alternatives package. */
export interface DecisionAlternativesResult {
  requestId: string;
  alternatives: DecisionAlternative[];
  summary: string;
  metadata?: DecisionMetadata;
}

/** Identified decision risk. */
export interface DecisionRisk {
  riskId: string;
  category: DecisionRiskCategory;
  title: string;
  description: string;
  severity: DecisionPriority;
  likelihood: number;
  mitigation: string;
  metadata?: DecisionMetadata;
}

/** Risks package. */
export interface DecisionRisksResult {
  requestId: string;
  risks: DecisionRisk[];
  primaryRisk: DecisionRisk | null;
  summary: string;
  metadata?: DecisionMetadata;
}

/** Scenario projection. */
export interface DecisionScenario {
  scenarioId: string;
  kind: DecisionScenarioKind;
  title: string;
  narrative: string;
  probability: number;
  outcomeValue: number;
  linkedAlternativeId?: string;
  metadata?: DecisionMetadata;
}

/** Scenarios package. */
export interface DecisionScenariosResult {
  requestId: string;
  scenarios: DecisionScenario[];
  summary: string;
  metadata?: DecisionMetadata;
}

/** Approval / governance record. */
export interface DecisionApproval {
  approvalId: string;
  requestId: string;
  status: DecisionApprovalStatus;
  approverRole: string;
  notes: string[];
  updatedAt: string;
  history: Array<{
    status: DecisionApprovalStatus;
    at: string;
    note?: string;
  }>;
  metadata?: DecisionMetadata;
}

/** Timeline estimates. */
export interface DecisionTimeline {
  timelineId: string;
  requestId: string;
  decisionDate: string;
  approvalDays: number;
  approvalBy: string;
  implementationDays: number;
  implementationBy: string;
  realizationDays: number;
  realizationBy: string;
  summary: string;
  metadata?: DecisionMetadata;
}

/** Ranked recommendation. */
export interface DecisionRecommendation {
  recommendationId: string;
  requestId: string;
  priority: DecisionPriority;
  confidence: IntelligenceConfidenceScore;
  expectedValue: string;
  recommendedAlternativeId: string;
  recommendedOption: string;
  rankedAlternativeIds: string[];
  rationale: string[];
  metadata?: DecisionMetadata;
}

/** Impact score. */
export interface DecisionImpactScore {
  dimension: DecisionImpactDimension;
  score: number;
  rationale: string;
}

/** Impact assessment. */
export interface DecisionImpactAssessment {
  requestId: string;
  scores: DecisionImpactScore[];
  overallScore: number;
  primaryDimensions: DecisionImpactDimension[];
  summary: string;
  metadata?: DecisionMetadata;
}

/** Executive decision brief. */
export interface DecisionBrief {
  briefId: string;
  requestId: string;
  decisionSummary: string;
  evidence: string[];
  alternatives: string[];
  recommendation: string;
  risks: string[];
  expectedOutcomes: string[];
  approvalStatus: DecisionApprovalStatus;
  timeline: string;
  confidence: IntelligenceConfidenceScore;
  narrative: string;
  createdAt: string;
  metadata?: DecisionMetadata;
}

/** Aggregate Decision Intelligence result. */
export interface DecisionIntelligenceResult {
  requestId: string;
  analysis: DecisionAnalysisResult;
  evidence: DecisionEvidenceResult;
  alternatives: DecisionAlternativesResult;
  risks: DecisionRisksResult;
  scenarios: DecisionScenariosResult;
  approval: DecisionApproval;
  timeline: DecisionTimeline;
  recommendation: DecisionRecommendation;
  impact: DecisionImpactAssessment;
  brief: DecisionBrief;
  domainVersion: string;
  completedAt: string;
  metadata?: DecisionMetadata;
}
