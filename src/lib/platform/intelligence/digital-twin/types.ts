/**
 * Organizational Digital Twin — shared types / DTOs (Sprint 071).
 *
 * Leaf module: soft-reads Portfolio / Initiative / Predictive lights into a
 * strategic sandbox. Distinct from frozen OIOS `OrganizationalDigitalTwin`
 * foundation snapshot (Sprint 031).
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const DIGITAL_TWIN_VERSION = "0.1.0";
export const DIGITAL_TWIN_MODULE_ID = "digital-twin" as const;

export const SCENARIO_KINDS = [
  "hire_teachers",
  "close_campus",
  "open_location",
  "reduce_budget",
  "increase_enrollment",
  "expand_virtual",
  "launch_initiative",
  "custom",
] as const;

export const IMPACT_DOMAINS = [
  "finance",
  "enrollment",
  "staffing",
  "operations",
  "compliance",
  "portfolio",
  "initiatives",
  "executive_kpis",
] as const;

export const CONSTRAINT_KINDS = [
  "budget_ceiling",
  "staffing_limit",
  "compliance_rule",
  "capacity_threshold",
  "policy_requirement",
  "governance_approval",
] as const;

export type ScenarioKind = (typeof SCENARIO_KINDS)[number];
export type ImpactDomain = (typeof IMPACT_DOMAINS)[number];
export type ConstraintKind = (typeof CONSTRAINT_KINDS)[number];
export type TwinMetadata = Record<string, unknown>;

export interface TwinScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-reads — no peer engine imports. */
export interface PortfolioResultLight extends ResultLightBase {
  health?: {
    value?: number;
    state?: string;
    riskIndex?: number;
    capacityUtilization?: number;
    strategicCoverage?: number;
  };
  prioritization?: Array<{
    initiativeId?: string;
    title?: string;
    composite?: number;
    rank?: number;
  }>;
  capacity?: {
    budgetUtilization?: number;
    staffUtilization?: number;
    overcommitted?: boolean;
    bottlenecks?: string[];
  };
  analytics?: { portfolioValue?: number; expectedRoi?: number };
  contributingDomains?: string[];
}

export interface InitiativeResultLight extends ResultLightBase {
  initiatives?: Array<{
    id?: string;
    title?: string;
    state?: string;
    executiveSummary?: string;
    progress?: { percentComplete?: number; healthScore?: number; healthStatus?: string };
    budget?: { planned?: number; actual?: number; forecast?: number };
    targetCompletionDate?: string;
  }>;
  activeCount?: number;
  atRiskCount?: number;
  contributingDomains?: string[];
}

export interface ExecutivePredictiveResultLight extends ResultLightBase {
  forecasts?: Array<{ subject?: string; direction?: string; confidence?: number }>;
  scenarios?: Array<{ kind?: string; label?: string; narrative?: string }>;
  contributingDomains?: string[];
}

export interface BriefingResultLight extends ResultLightBase {
  healthScore?: { value?: number; label?: string };
  briefing?: { sections?: { executiveSummary?: string } };
  contributingDomains?: string[];
}

export interface OrganizationModel {
  structure: {
    organizationId: string | null;
    schoolId: string | null;
    departments: string[];
    programs: string[];
  };
  staffing: { headcount: number; vacancyRate: number };
  finance: { operatingBudget: number; spent: number; forecast: number };
  operations: { utilization: number; bandwidth: number };
  initiatives: Array<{ id: string; title: string; state: string; health?: number }>;
  portfolio: {
    health?: number;
    capacityUtilization?: number;
    riskIndex?: number;
    value?: number;
  };
  dependencies: Array<{ from: string; to: string; kind: string }>;
}

export interface TwinConstraint {
  id: string;
  kind: ConstraintKind;
  label: string;
  limit: number;
  current: number;
  violated: boolean;
  explanation: string;
}

export interface DomainImpact {
  domain: ImpactDomain;
  delta: number;
  direction: "improving" | "degrading" | "neutral";
  narrative: string;
}

export interface ScenarioDefinition {
  id: string;
  kind: ScenarioKind;
  label: string;
  description: string;
  parameters: Record<string, number | string | boolean>;
}

export interface SimulationState {
  id: string;
  scenarioId: string;
  isolated: true;
  model: OrganizationModel;
  impacts: DomainImpact[];
  constraints: TwinConstraint[];
  valid: boolean;
  invalidReasons: string[];
  confidence: number;
  assumptions: string[];
  uncertainties: string[];
  domainsConsulted: string[];
  createdAt: string;
}

export interface ScenarioComparison {
  baselineId: string;
  scenarioIds: string[];
  rows: Array<{
    metric: string;
    baseline: number;
    scenarios: Record<string, number>;
  }>;
  highlight: string;
}

export interface TwinRecommendation {
  id: string;
  preferredScenarioId: string | null;
  tradeOffs: string[];
  resourceImplications: string[];
  majorRisks: string[];
  nextSteps: string[];
  /** Sprint 066 governance — never auto-execute. */
  advisoryOnly: true;
  humanAuthorizationRequired: true;
  mayAutoExecute: false;
}

export interface TwinExplainability {
  executiveSummary: string;
  assumptions: string[];
  confidence: number;
  inputsUsed: string[];
  domainsConsulted: string[];
  constraintsEncountered: string[];
  knownUncertainties: string[];
  contributingDomains: string[];
}

export interface TwinRequest {
  requestId: string;
  scope: TwinScope;
  periodLabel?: string;
  scenarios?: Array<Partial<ScenarioDefinition> & { kind: ScenarioKind }>;
  portfolioResult?: PortfolioResultLight;
  initiativeResult?: InitiativeResultLight;
  predictiveResult?: ExecutivePredictiveResultLight;
  briefingResult?: BriefingResultLight;
  metadata?: TwinMetadata;
}

export interface TwinResult {
  requestId: string;
  version: string;
  scope: TwinScope;
  generatedAt: string;
  liveModel: OrganizationModel;
  scenarios: ScenarioDefinition[];
  simulations: SimulationState[];
  comparisons: ScenarioComparison[];
  recommendation: TwinRecommendation;
  explainability: TwinExplainability;
  contributingDomains: string[];
  metadata: TwinMetadata;
}
