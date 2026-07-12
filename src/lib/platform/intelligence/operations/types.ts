/**
 * Operations Intelligence — shared types / OperationsModels DTOs (Sprint 038).
 *
 * Continuously monitor and optimize day-to-day organizational operations —
 * workflow health, process monitoring, staffing analytics, automation
 * opportunities, capacity planning, and resource utilization.
 *
 * Composed on Organizational DNA + OIOS Core; soft-reads Organization Health,
 * Human Capital, Business Model, and Organizational Improvement.
 *
 * Does NOT regenerate organization-health's operations.ts stub.
 */

import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

/** Semantic version of the Operations Intelligence pack. */
export const OPERATIONS_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type OperationsMetadata = Record<string, unknown>;

/** Re-export graph scope for operations records. */
export type { GraphScope };

/** Confidence bands. */
export const OPERATIONS_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type OperationsConfidenceLevel =
  (typeof OPERATIONS_CONFIDENCE_LEVELS)[number];

/** Priority / severity bands. */
export const OPERATIONS_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type OperationsPriorityBand =
  (typeof OPERATIONS_PRIORITY_BANDS)[number];

/** Health status bands. */
export const OPERATIONS_HEALTH_STATUSES = [
  "excellent",
  "healthy",
  "warning",
  "critical",
] as const;
export type OperationsHealthStatus =
  (typeof OPERATIONS_HEALTH_STATUSES)[number];

/** Artifact lifecycle. */
export const OPERATIONS_ARTIFACT_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "distributed",
  "archived",
  "superseded",
] as const;
export type OperationsArtifactStatus =
  (typeof OPERATIONS_ARTIFACT_STATUSES)[number];

/** Workflow health dimensions. */
export const WORKFLOW_HEALTH_DIMENSIONS = [
  "throughput",
  "cycle_time",
  "backlog",
  "sla_adherence",
  "error_rate",
  "handoff_friction",
] as const;
export type WorkflowHealthDimension =
  (typeof WORKFLOW_HEALTH_DIMENSIONS)[number];

/** Process monitoring areas. */
export const PROCESS_MONITORING_AREAS = [
  "enrollment",
  "admissions",
  "attendance",
  "scheduling",
  "finance_ops",
  "staffing",
  "support",
  "compliance_ops",
] as const;
export type ProcessMonitoringArea =
  (typeof PROCESS_MONITORING_AREAS)[number];

/** Automation opportunity kinds. */
export const AUTOMATION_OPPORTUNITY_KINDS = [
  "task_automation",
  "workflow_orchestration",
  "decision_support",
  "intake_triage",
  "reporting",
  "communications",
] as const;
export type AutomationOpportunityKind =
  (typeof AUTOMATION_OPPORTUNITY_KINDS)[number];

/** Capacity planning horizons. */
export const CAPACITY_PLANNING_HORIZONS = [
  "immediate",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
] as const;
export type CapacityPlanningHorizon =
  (typeof CAPACITY_PLANNING_HORIZONS)[number];

/**
 * Six-lens impact narrative — every recommendation must address:
 * workflow health, process bottlenecks, staffing adequacy,
 * automation potential, capacity outlook, resource utilization.
 */
export interface OperationsLensImpact {
  workflowHealth: string;
  processBottlenecks: string;
  staffingAdequacy: string;
  automationPotential: string;
  capacityOutlook: string;
  resourceUtilization: string;
}

/** Calibrated confidence. */
export interface OperationsConfidenceScore {
  value: number;
  level: OperationsConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Shared score card. */
export interface OperationsScore {
  key: string;
  label: string;
  value: number;
  status: OperationsHealthStatus;
  band: OperationsPriorityBand;
  narrative: string;
}

/** Baseline signals when upstream modules are sparse. */
export interface OperationsBaseline {
  workflowHealthScore: number;
  processMaturity: number;
  staffingAdequacy: number;
  capacityHeadroom: number;
  automationReadiness: number;
  resourceUtilization: number;
  operationsScore: number;
  workforceScore: number;
  operationalComplexity: number;
  organizationHealthScore: number;
  financialScore: number;
  executionScore: number;
  staffCount: number;
  enrollment: number;
  studentAttendance: number;
  teacherAttendance: number;
  openRoles: number;
  backlogPressure: number;
  slaRisk: number;
}

/** Optional financial signal from organization-health / finance context. */
export interface FinancialSignal {
  revenue: number;
  expenses: number;
  marginPct: number;
  cash?: number;
}

/** Light upstream result attachments (avoid circular imports). */
export interface HumanCapitalResultLight {
  requestId?: string;
  workforceHealthScore?: { value?: number };
  talentRiskScore?: { value?: number };
  baseline?: {
    headcount?: number;
    openRoles?: number;
    workforceCapacity?: number;
  };
  recommendations?: string[];
}

export interface BusinessModelResultLight {
  healthScore?: { value?: number };
  clarityScore?: { value?: number };
  baseline?: {
    operationalComplexity?: number;
    scalabilityScore?: number;
    sustainabilityScore?: number;
  };
  recommendations?: string[];
}

export interface ImprovementResultLight {
  improvementScore?: { value?: number };
  healthScore?: { value?: number };
  recommendations?: string[];
}

/** Shared recommendation shape. */
export interface OperationsRecommendationRecord {
  id: string;
  title: string;
  priority: OperationsPriorityBand;
  score: number;
  rationale: string;
  lenses: OperationsLensImpact;
  narrative: string;
  expectedLift: string;
  riskReduction: string;
}

/* -------------------------------------------------------------------------- */
/* Workflow health                                                             */
/* -------------------------------------------------------------------------- */

export interface WorkflowHealthDimensionRecord {
  dimension: WorkflowHealthDimension;
  label: string;
  score: number;
  status: OperationsHealthStatus;
  signal: string;
  narrative: string;
}

export interface WorkflowHealthResult {
  dimensions: WorkflowHealthDimensionRecord[];
  overallScore: number;
  status: OperationsHealthStatus;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Process monitoring                                                          */
/* -------------------------------------------------------------------------- */

export interface ProcessMonitoringRecord {
  area: ProcessMonitoringArea;
  label: string;
  healthScore: number;
  bottleneckScore: number;
  status: OperationsHealthStatus;
  signals: string[];
  narrative: string;
}

export interface ProcessMonitoringSuite {
  areas: ProcessMonitoringRecord[];
  overallScore: number;
  hottestBottleneck: ProcessMonitoringArea;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Staffing analytics                                                          */
/* -------------------------------------------------------------------------- */

export interface StaffingAnalyticsResult {
  adequacyScore: number;
  coverageRatio: number;
  openRoles: number;
  staffCount: number;
  attendancePressure: number;
  burnoutProxy: number;
  status: OperationsHealthStatus;
  gaps: string[];
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Capacity planning                                                           */
/* -------------------------------------------------------------------------- */

export interface CapacityHorizonRecord {
  horizon: CapacityPlanningHorizon;
  label: string;
  demandIndex: number;
  supplyIndex: number;
  headroom: number;
  status: OperationsHealthStatus;
  actions: string[];
  narrative: string;
}

export interface CapacityPlanResult {
  horizons: CapacityHorizonRecord[];
  overallHeadroom: number;
  constrainedHorizon: CapacityPlanningHorizon;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Automation opportunities                                                    */
/* -------------------------------------------------------------------------- */

export interface AutomationOpportunityRecord {
  id: string;
  kind: AutomationOpportunityKind;
  label: string;
  score: number;
  priority: OperationsPriorityBand;
  effort: "low" | "medium" | "high";
  expectedHoursSaved: number;
  lenses: OperationsLensImpact;
  narrative: string;
}

export interface AutomationOpportunitySuite {
  opportunities: AutomationOpportunityRecord[];
  readinessScore: number;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Resource utilization                                                        */
/* -------------------------------------------------------------------------- */

export interface ResourceUtilizationResult {
  overallUtilization: number;
  staffUtilization: number;
  scheduleUtilization: number;
  facilityProxy: number;
  idleCapacity: number;
  overloadRisk: number;
  status: OperationsHealthStatus;
  levers: string[];
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Outputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface OperationsHealthResult {
  overallScore: number;
  status: OperationsHealthStatus;
  dimensions: Record<string, number>;
  lenses: OperationsLensImpact;
  narrative: string;
}

export interface OperationsDashboardResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  workflowScore: number;
  staffingScore: number;
  capacityScore: number;
  automationScore: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface OperationsRiskRecord {
  id: string;
  title: string;
  severity: OperationsPriorityBand;
  score: number;
  dimension:
    | WorkflowHealthDimension
    | ProcessMonitoringArea
    | "staffing"
    | "capacity"
    | "automation"
    | "utilization";
  mitigation: string;
  lenses: OperationsLensImpact;
  narrative: string;
}

export interface OperationsOpportunityRecord {
  id: string;
  title: string;
  priority: OperationsPriorityBand;
  score: number;
  expectedValue: number;
  lenses: OperationsLensImpact;
  narrative: string;
}

export interface ExecutiveOperationsBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  healthScore: number;
  workflowScore: number;
  staffingScore: number;
  capacityScore: number;
  automationScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  hottestBottleneck: string;
  lenses: OperationsLensImpact;
  narrative: string;
}

export interface OperationsProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  workflowScore: number;
  staffingScore: number;
  capacityScore: number;
  automationScore: number;
  workflowHealth: WorkflowHealthResult;
  processMonitoring: ProcessMonitoringSuite;
  capacityPlan: CapacityPlanResult;
  brief: ExecutiveOperationsBrief;
  dashboard: OperationsDashboardResult;
  metrics: {
    staffCount: number;
    enrollment: number;
    openRoles: number;
    resourceUtilization: number;
    operationalComplexity: number;
    backlogPressure: number;
  };
  overallConfidence: OperationsConfidenceScore;
}

export interface OperationsHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: OperationsArtifactStatus;
  healthScore: number;
  generatedAt: string;
  summary: string;
  metadata: OperationsMetadata;
}

export interface OperationsQueryRequest {
  question: string;
  focus?:
    | "general"
    | "workflow"
    | "process"
    | "staffing"
    | "capacity"
    | "automation"
    | "utilization"
    | "risk"
    | "opportunity";
  maxResults?: number;
}

export interface OperationsQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: OperationsConfidenceScore;
}

/** Registry publisher descriptor. */
export interface OperationsPublisher {
  domain: string;
  capability: string;
}

/* -------------------------------------------------------------------------- */
/* Request / Result                                                            */
/* -------------------------------------------------------------------------- */

export interface OperationsRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dnaResult?: OrganizationDnaResult;
  dna?: OrganizationDNA;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult;
  predictionResult?: PredictionResult;
  humanCapitalResult?: HumanCapitalResultLight;
  businessModelResult?: BusinessModelResultLight;
  improvementResult?: ImprovementResultLight;
  financialSignal?: FinancialSignal;
  baselineOverrides?: Partial<OperationsBaseline>;
  metadata?: OperationsMetadata;
}

/** Full operations generation result. */
export interface OperationsResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: OperationsBaseline;
  /** Core scores */
  healthScore: OperationsScore;
  workflowScore: OperationsScore;
  staffingScore: OperationsScore;
  capacityScore: OperationsScore;
  automationScore: OperationsScore;
  riskScore: OperationsScore;
  operationsHealth: OperationsHealthResult;
  /** Domain suites */
  workflowHealth: WorkflowHealthResult;
  processMonitoring: ProcessMonitoringSuite;
  staffingAnalytics: StaffingAnalyticsResult;
  capacityPlan: CapacityPlanResult;
  automationOpportunities: AutomationOpportunitySuite;
  resourceUtilization: ResourceUtilizationResult;
  /** Outputs */
  dashboard: OperationsDashboardResult;
  risks: OperationsRiskRecord[];
  opportunities: OperationsOpportunityRecord[];
  brief: ExecutiveOperationsBrief;
  projection: OperationsProjectionResult;
  confidence: OperationsConfidenceScore;
  recommendations: OperationsRecommendationRecord[];
  historyRecord: OperationsHistoryRecord;
  metadata: OperationsMetadata;
}
