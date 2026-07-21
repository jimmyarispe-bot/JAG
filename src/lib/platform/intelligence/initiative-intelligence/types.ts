/**
 * Initiative Intelligence — shared types / DTOs (Sprint 069).
 *
 * Leaf module: soft-reads executive-stack lights into living initiatives.
 * System of record for strategic execution — no duplicated domain logic.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const INITIATIVE_INTELLIGENCE_VERSION = "0.1.0";
export const INITIATIVE_INTELLIGENCE_MODULE_ID = "initiative-intelligence" as const;

export const INITIATIVE_LIFECYCLE_STATES = [
  "proposed",
  "approved",
  "planned",
  "active",
  "on_hold",
  "at_risk",
  "completed",
  "cancelled",
  "archived",
] as const;

export const INITIATIVE_HEALTH_STATUSES = [
  "healthy",
  "watch",
  "at_risk",
  "critical",
] as const;

export const INITIATIVE_OWNERSHIP_ROLES = [
  "executive_sponsor",
  "initiative_owner",
  "contributor",
  "reviewer",
  "approver",
] as const;

export const INITIATIVE_LINK_KINDS = [
  "brief",
  "decision",
  "prediction",
  "autonomous_plan",
  "copilot_investigation",
  "executive_memory",
  "evidence",
  "document",
  "command_center",
] as const;

export type InitiativeLifecycleState = (typeof INITIATIVE_LIFECYCLE_STATES)[number];
export type InitiativeHealthStatus = (typeof INITIATIVE_HEALTH_STATUSES)[number];
export type InitiativeOwnershipRole = (typeof INITIATIVE_OWNERSHIP_ROLES)[number];
export type InitiativeLinkKind = (typeof INITIATIVE_LINK_KINDS)[number];
export type InitiativeMetadata = Record<string, unknown>;

export interface InitiativeScope {
  organizationId: string | null;
  schoolId: string | null;
}

export interface LifecycleTransition {
  id: string;
  from: InitiativeLifecycleState | null;
  to: InitiativeLifecycleState;
  at: string;
  byRole: InitiativeOwnershipRole | "system";
  rationale?: string;
}

export interface InitiativeObjective {
  id: string;
  title: string;
  summary: string;
  strategicTheme?: string;
}

export interface InitiativeOutcome {
  id: string;
  title: string;
  description: string;
  successCriteria: string[];
}

export interface InitiativeKpi {
  id: string;
  name: string;
  unit?: string;
  baseline?: number;
  target: number;
  actual?: number;
  weight?: number;
}

export interface InitiativeOwner {
  role: InitiativeOwnershipRole;
  /** RBAC / org assignment key — never a hard-coded person name. */
  assignmentKey: string;
  label?: string;
}

export interface InitiativeBudget {
  planned: number;
  actual: number;
  forecast: number;
  currency?: string;
  staffingAssumptions?: string[];
  resourceNotes?: string[];
}

export interface WorkItem {
  id: string;
  title: string;
  summary?: string;
  ownerRole?: InitiativeOwnershipRole;
  dueDate?: string;
  status: "pending" | "in_progress" | "blocked" | "done" | "cancelled";
  percentComplete: number;
  dependsOn: string[];
  children: WorkItem[];
  deliverable?: string;
}

export interface Milestone {
  id: string;
  title: string;
  summary?: string;
  dueDate?: string;
  status: "pending" | "in_progress" | "done" | "missed";
  percentComplete: number;
  ownerRole?: InitiativeOwnershipRole;
  workItems: WorkItem[];
  dependsOn: string[];
}

export interface InitiativeRisk {
  id: string;
  title: string;
  summary: string;
  severity: number;
  likelihood: number;
  status: "open" | "mitigating" | "closed";
  escalationRequired?: boolean;
}

export interface InitiativeBlocker {
  id: string;
  title: string;
  summary: string;
  since: string;
  requiredApprovalRole?: InitiativeOwnershipRole;
  dependencyIds?: string[];
}

export interface InitiativeLink {
  kind: InitiativeLinkKind;
  refId: string;
  label?: string;
  domain?: string;
}

export interface InitiativeProgress {
  percentComplete: number;
  scheduleVarianceDays: number;
  budgetVariance: number;
  budgetVariancePct: number;
  kpiAchievement: number;
  milestoneCompletion: number;
  healthScore: number;
  healthStatus: InitiativeHealthStatus;
}

export interface InitiativeOutcomeMeasurement {
  actualOutcomes: string[];
  kpiResults: Array<{ kpiId: string; name: string; target: number; actual: number; met: boolean }>;
  budgetPerformance: { planned: number; actual: number; variance: number };
  timelinePerformance: { targetDate?: string; completedAt?: string; varianceDays: number };
  lessonsLearned: string[];
  futureRecommendations: string[];
  persistedToMemory: boolean;
}

export interface Initiative {
  id: string;
  title: string;
  executiveSummary: string;
  businessCase: string;
  state: InitiativeLifecycleState;
  objective: InitiativeObjective;
  expectedOutcomes: InitiativeOutcome[];
  kpis: InitiativeKpi[];
  targetCompletionDate?: string;
  owners: InitiativeOwner[];
  budget: InitiativeBudget;
  milestones: Milestone[];
  risks: InitiativeRisk[];
  blockers: InitiativeBlocker[];
  links: InitiativeLink[];
  progress: InitiativeProgress;
  transitions: LifecycleTransition[];
  outcome?: InitiativeOutcomeMeasurement;
  createdAt: string;
  updatedAt: string;
  metadata: InitiativeMetadata;
}

/** Soft-read lights — no peer engine imports. */
export interface BriefingResultLight extends ResultLightBase {
  briefing?: {
    sections?: {
      executiveSummary?: string;
      topOpportunities?: Array<{ id?: string; title?: string; summary?: string; estimatedImpact?: number }>;
      topRisks?: Array<{ id?: string; title?: string; summary?: string; severity?: number }>;
    };
  };
  decisionQueue?: Array<{ id?: string; title?: string; decisionNeeded?: string; recommendedDecision?: string }>;
  contributingDomains?: string[];
}

export interface DecisionIntelligenceResultLight extends ResultLightBase {
  recommendation?: {
    id?: string;
    executiveSummary?: string;
    rankedOptions?: Array<{
      id?: string;
      title?: string;
      summary?: string;
      category?: string;
      confidence?: number;
      scorecard?: { overall?: number; roi?: number };
    }>;
  };
  contributingDomains?: string[];
}

export interface ExecutivePredictiveResultLight extends ResultLightBase {
  forecasts?: Array<{ subject?: string; direction?: string; confidence?: number }>;
  emergingSignals?: Array<{ title?: string; narrative?: string; strength?: number }>;
  contributingDomains?: string[];
}

export interface AutonomousResultLight extends ResultLightBase {
  plans?: Array<{
    id?: string;
    objective?: string;
    optionTitle?: string;
    readiness?: string;
    humanAuthorizationRequired?: boolean;
  }>;
  approvalQueue?: Array<{ role?: string; status?: string }>;
  contributingDomains?: string[];
}

export interface CopilotResultLight extends ResultLightBase {
  answer?: string;
  explainability?: { executiveSummary?: string; contributingDomains?: string[] };
  contributingDomains?: string[];
}

export interface ExecutiveMemoryResultLight extends ResultLightBase {
  decisions?: Array<{ id?: string; title?: string; actualOutcome?: string }>;
  contributingDomains?: string[];
}

export interface CommandCenterResultLight extends ResultLightBase {
  role?: string;
  widgets?: Array<{ kind?: string; title?: string }>;
  contributingDomains?: string[];
}

export interface InitiativeRequest {
  requestId: string;
  scope: InitiativeScope;
  periodLabel?: string;
  /** Seed initiatives (tests / hydration). */
  seeds?: Partial<Initiative>[];
  briefingResult?: BriefingResultLight;
  decisionResult?: DecisionIntelligenceResultLight;
  predictiveResult?: ExecutivePredictiveResultLight;
  autonomousResult?: AutonomousResultLight;
  copilotResult?: CopilotResultLight;
  memoryResult?: ExecutiveMemoryResultLight;
  commandCenterResult?: CommandCenterResultLight;
  /** Actor role for lifecycle attribution. */
  actorRole?: InitiativeOwnershipRole | "system";
  metadata?: InitiativeMetadata;
}

export interface InitiativeResult {
  requestId: string;
  version: string;
  scope: InitiativeScope;
  generatedAt: string;
  initiatives: Initiative[];
  activeCount: number;
  atRiskCount: number;
  completedCount: number;
  portfolioHealth: { value: number; label: InitiativeHealthStatus };
  explainability: {
    executiveSummary: string;
    contributingDomains: string[];
  };
  memoryLessons: Array<{ initiativeId: string; lesson: string }>;
  contributingDomains: string[];
  metadata: InitiativeMetadata;
}
