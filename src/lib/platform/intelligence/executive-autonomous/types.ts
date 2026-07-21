/**
 * Autonomous Intelligence — shared types / DTOs (Sprint 066).
 *
 * Leaf module: soft-reads decision-intelligence + executive-predictive lights.
 * Package path is `executive-autonomous` — prepares execution plans; never auto-executes.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const EXECUTIVE_AUTONOMOUS_VERSION = "0.1.0";
export const EXECUTIVE_AUTONOMOUS_MODULE_ID = "executive-autonomous" as const;

export const WORKFLOW_KINDS = [
  "staffing",
  "finance",
  "enrollment",
  "compliance",
  "grants",
  "operations",
] as const;

export const APPROVAL_ROLES = [
  "founder",
  "ceo",
  "executive_director",
  "school_leader",
  "board",
  "finance_lead",
  "compliance_lead",
] as const;

export const READINESS_STATES = [
  "ready",
  "blocked",
  "waiting_approval",
  "waiting_resources",
  "waiting_information",
  "scheduled",
] as const;

export const PREREQUISITE_KINDS = [
  "approval",
  "information",
  "resource",
  "budget",
  "compliance",
] as const;

export type WorkflowKind = (typeof WORKFLOW_KINDS)[number];
export type ApprovalRole = (typeof APPROVAL_ROLES)[number];
export type ReadinessState = (typeof READINESS_STATES)[number];
export type PrerequisiteKind = (typeof PREREQUISITE_KINDS)[number];
export type AutonomousMetadata = Record<string, unknown>;

export interface AutonomousScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-read of DecisionIntelligenceResult. */
export interface DecisionIntelligenceResultLight extends ResultLightBase {
  requestId?: string;
  recommendation?: {
    id?: string;
    executiveSummary?: string;
    recommendedOptionId?: string | null;
    rankedOptions?: Array<{
      id?: string;
      title?: string;
      summary?: string;
      category?: string;
      confidence?: number;
      estimatedEffort?: string;
      scorecard?: {
        overall?: number;
        expectedImpact?: number;
        financialImpact?: number;
        operationalImpact?: number;
        risk?: number;
        effort?: number;
      };
    }>;
    confidence?: number;
    issue?: { title?: string; kind?: string; domains?: string[] };
  };
  contributingDomains?: string[];
}

/** Soft-read of ExecutivePredictiveResult. */
export interface ExecutivePredictiveResultLight extends ResultLightBase {
  requestId?: string;
  healthScore?: { value?: number; label?: string };
  forecasts?: Array<{
    subject?: string;
    horizon?: string;
    direction?: string;
    confidence?: number;
    projectedValue?: number;
  }>;
  emergingSignals?: Array<{
    title?: string;
    subject?: string;
    narrative?: string;
    strength?: number;
  }>;
  decisionImpacts?: Array<{
    optionId?: string;
    optionTitle?: string;
    organizationalImpact?: number;
    financialImpact?: number;
    operationalImpact?: number;
    implementationHorizon?: string;
    confidence?: number;
    narrative?: string;
  }>;
  scenarios?: Array<{
    kind?: string;
    label?: string;
    narrative?: string;
    overallOutlook?: number;
  }>;
  contributingDomains?: string[];
}

export interface OrganizationalPolicy {
  id: string;
  key: string;
  description: string;
  /** Roles that must approve when policy applies. */
  requiredRoles: ApprovalRole[];
  /** Domains / workflow kinds this policy covers. */
  appliesTo: Array<WorkflowKind | string>;
  /** When true, missing satisfaction blocks readiness. */
  blocking: boolean;
  threshold?: {
    financialImpactMin?: number;
    riskMin?: number;
    effortMin?: number;
  };
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  ownerRole: ApprovalRole | "operations_lead" | "admissions_lead" | "hr_lead";
  estimatedDays: number;
  dependsOn: string[];
  checklist: string[];
  milestone?: string;
}

export interface PlanPrerequisite {
  id: string;
  kind: PrerequisiteKind;
  label: string;
  satisfied: boolean;
  blocking: boolean;
  detail?: string;
}

export interface ApprovalStep {
  id: string;
  role: ApprovalRole;
  policyId: string;
  policyKey: string;
  status: "pending" | "approved" | "rejected" | "skipped";
  required: boolean;
  rationale: string;
}

export interface RollbackPlan {
  conditions: string[];
  recoverySteps: string[];
  notifications: string[];
  impactAssessment: string;
}

export interface PlanAssumption {
  id: string;
  statement: string;
  critical: boolean;
}

export interface PlanExplainability {
  whyWorkflowSelected: string;
  recommendationId: string | null;
  recommendationSummary: string;
  predictionInfluence: string[];
  applicablePolicies: string[];
  assumptions: PlanAssumption[];
  confidenceGuidance: string;
}

export interface ExecutionPlan {
  id: string;
  workflowKind: WorkflowKind;
  objective: string;
  tasks: PlanTask[];
  dependencies: PlanPrerequisite[];
  estimatedDurationDays: number;
  requiredApprovals: ApprovalStep[];
  successCriteria: string[];
  rollback: RollbackPlan;
  readiness: ReadinessState;
  readinessReasons: string[];
  explainability: PlanExplainability;
  optionId: string | null;
  optionTitle: string;
  generatedAt: string;
  humanAuthorizationRequired: true;
  autoExecute: false;
}

export interface WorkflowTemplate {
  kind: WorkflowKind;
  label: string;
  objectiveTemplate: string;
  defaultTasks: Array<Omit<PlanTask, "id">>;
  successCriteria: string[];
  rollbackDefaults: RollbackPlan;
  assumptions: string[];
}

export interface AutonomousPreparation {
  id: string;
  planId: string;
  checklist: string[];
  requiredDocuments: string[];
  responsibleOwners: string[];
  timeline: Array<{ milestone: string; dayOffset: number }>;
  milestones: string[];
  dependencies: string[];
  approvalChain: ApprovalRole[];
  authorizationNote: string;
}

export interface AutonomousRequest {
  requestId: string;
  scope: AutonomousScope;
  decisionResult?: DecisionIntelligenceResultLight;
  predictiveResult?: ExecutivePredictiveResultLight;
  policies?: OrganizationalPolicy[];
  /** Simulated satisfied prerequisite ids for readiness tests. */
  satisfiedPrerequisiteIds?: string[];
  /** Simulated approved roles. */
  approvedRoles?: ApprovalRole[];
  periodLabel?: string;
  metadata?: AutonomousMetadata;
}

export interface AutonomousResult {
  requestId: string;
  version: string;
  scope: AutonomousScope;
  generatedAt: string;
  plans: ExecutionPlan[];
  preparations: AutonomousPreparation[];
  approvalQueue: ApprovalStep[];
  explainability: PlanExplainability;
  contributingDomains: string[];
  metadata: AutonomousMetadata;
  /** Explicit governance flag — never auto-executes. */
  autoExecute: false;
  humanInTheLoop: true;
}
