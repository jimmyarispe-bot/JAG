/**
 * Portfolio Intelligence — shared types / DTOs (Sprint 070).
 *
 * Leaf module: soft-reads Initiative Intelligence (+ executive stack lights)
 * into an enterprise portfolio. No duplicated domain logic.
 *
 * Distinct from frozen `innovation/innovation-portfolio-intelligence`.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const PORTFOLIO_INTELLIGENCE_VERSION = "0.1.0";
export const PORTFOLIO_INTELLIGENCE_MODULE_ID = "portfolio-intelligence" as const;

export const ALIGNMENT_BANDS = ["high", "medium", "low"] as const;
export const PORTFOLIO_HEALTH_STATES = [
  "excellent",
  "healthy",
  "watch",
  "at_risk",
  "critical",
] as const;
export const OPTIMIZATION_KINDS = [
  "sequence_change",
  "resource_shift",
  "defer",
  "accelerate",
  "consolidate",
  "retire",
] as const;
export const SCENARIO_KINDS = [
  "current",
  "budget_reduction",
  "budget_expansion",
  "hiring_freeze",
  "accelerated_growth",
  "custom",
] as const;
export const DEPENDENCY_KINDS = [
  "shared_milestone",
  "shared_owner",
  "shared_funding",
  "prerequisite",
  "conflicting_timeline",
] as const;

export type AlignmentBand = (typeof ALIGNMENT_BANDS)[number];
export type PortfolioHealthState = (typeof PORTFOLIO_HEALTH_STATES)[number];
export type OptimizationKind = (typeof OPTIMIZATION_KINDS)[number];
export type ScenarioKind = (typeof SCENARIO_KINDS)[number];
export type DependencyKind = (typeof DEPENDENCY_KINDS)[number];
export type PortfolioMetadata = Record<string, unknown>;

export interface PortfolioScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-read initiative light — no initiative-intelligence package import. */
export interface InitiativeLight {
  id?: string;
  title?: string;
  executiveSummary?: string;
  state?: string;
  businessCase?: string;
  targetCompletionDate?: string;
  progress?: {
    percentComplete?: number;
    healthScore?: number;
    healthStatus?: string;
    budgetVariancePct?: number;
    scheduleVarianceDays?: number;
    kpiAchievement?: number;
  };
  budget?: { planned?: number; actual?: number; forecast?: number };
  owners?: Array<{ role?: string; assignmentKey?: string; label?: string }>;
  risks?: Array<{ title?: string; severity?: number; likelihood?: number; status?: string }>;
  milestones?: Array<{
    id?: string;
    title?: string;
    dueDate?: string;
    status?: string;
    percentComplete?: number;
  }>;
  kpis?: Array<{ name?: string; target?: number; actual?: number }>;
  links?: Array<{ kind?: string; refId?: string; domain?: string }>;
  metadata?: PortfolioMetadata;
}

export interface InitiativeResultLight extends ResultLightBase {
  initiatives?: InitiativeLight[];
  activeCount?: number;
  atRiskCount?: number;
  completedCount?: number;
  portfolioHealth?: { value?: number; label?: string };
  contributingDomains?: string[];
}

export interface BriefingResultLight extends ResultLightBase {
  briefing?: {
    sections?: {
      executiveSummary?: string;
      topRisks?: Array<{ title?: string; severity?: number }>;
    };
  };
  contributingDomains?: string[];
}

export interface DecisionIntelligenceResultLight extends ResultLightBase {
  recommendation?: {
    executiveSummary?: string;
    rankedOptions?: Array<{ title?: string; confidence?: number; scorecard?: { roi?: number } }>;
  };
  contributingDomains?: string[];
}

export interface ExecutivePredictiveResultLight extends ResultLightBase {
  forecasts?: Array<{ subject?: string; direction?: string; confidence?: number }>;
  scenarios?: Array<{ kind?: string; label?: string; narrative?: string }>;
  contributingDomains?: string[];
}

export interface AutonomousResultLight extends ResultLightBase {
  plans?: Array<{ id?: string; objective?: string; readiness?: string }>;
  autoExecute?: boolean;
  contributingDomains?: string[];
}

export interface AlignmentScore {
  band: AlignmentBand;
  score: number;
  factors: Array<{ factor: string; weight: number; contribution: number; note: string }>;
  explainability: string;
}

export interface PriorityScorecard {
  initiativeId: string;
  title: string;
  composite: number;
  rank: number;
  impact: number;
  alignment: number;
  roi: number;
  risk: number;
  urgency: number;
  resourceDemand: number;
  executivePriority: number;
  predictionConfidence: number;
  explainability: string;
}

export interface CapacitySnapshot {
  budgetUtilization: number;
  staffUtilization: number;
  leadershipAttention: number;
  operationalBandwidth: number;
  timePressure: number;
  overcommitted: boolean;
  underutilized: boolean;
  bottlenecks: string[];
  recommendations: string[];
}

export interface ResourceAllocation {
  initiativeId: string;
  title: string;
  budgetShare: number;
  staffShare: number;
  sponsorShare: number;
  sharedServicesShare: number;
  notes: string[];
}

export interface CrossInitiativeDependency {
  id: string;
  kind: DependencyKind;
  fromInitiativeId: string;
  toInitiativeId: string;
  label: string;
  severity: number;
}

export interface PortfolioHealth {
  value: number;
  state: PortfolioHealthState;
  budgetPerformance: number;
  schedulePerformance: number;
  riskIndex: number;
  capacityUtilization: number;
  completionRate: number;
  strategicCoverage: number;
  explainability: string;
}

export interface RoadmapItem {
  initiativeId: string;
  title: string;
  sequence: number;
  startHint?: string;
  endHint?: string;
  theme?: string;
}

export interface OptimizationRecommendation {
  id: string;
  kind: OptimizationKind;
  title: string;
  summary: string;
  initiativeIds: string[];
  advisory: true;
  governanceNote: string;
  expectedImpact: number;
}

export interface PortfolioScenario {
  kind: ScenarioKind;
  label: string;
  narrative: string;
  budgetMultiplier: number;
  capacityMultiplier: number;
  projectedHealth: number;
  projectedRoi: number;
  initiativeAdjustments: Array<{ initiativeId: string; action: string; rationale: string }>;
}

export interface PortfolioAnalytics {
  portfolioValue: number;
  expectedRoi: number;
  strategicCoverage: number;
  resourceUtilization: number;
  budgetAllocation: number;
  initiativeAgingDays: number;
  completionTrend: number;
}

export interface PortfolioProgram {
  id: string;
  name: string;
  theme: string;
  initiativeIds: string[];
}

export interface StrategicTheme {
  id: string;
  name: string;
  priority: number;
}

export interface PortfolioRegistry {
  id: string;
  name: string;
  themes: StrategicTheme[];
  programs: PortfolioProgram[];
  initiativeIds: string[];
  totalBudgetPlanned: number;
  totalBudgetActual: number;
}

export interface ScoredInitiative {
  initiative: InitiativeLight;
  alignment: AlignmentScore;
  priority: PriorityScorecard;
}

export interface PortfolioRequest {
  requestId: string;
  scope: PortfolioScope;
  periodLabel?: string;
  initiativeResult?: InitiativeResultLight;
  briefingResult?: BriefingResultLight;
  decisionResult?: DecisionIntelligenceResultLight;
  predictiveResult?: ExecutivePredictiveResultLight;
  autonomousResult?: AutonomousResultLight;
  missionHint?: string;
  visionHint?: string;
  boardGoals?: string[];
  annualObjectives?: string[];
  customScenario?: { label: string; budgetMultiplier: number; capacityMultiplier: number };
  metadata?: PortfolioMetadata;
}

export interface PortfolioResult {
  requestId: string;
  version: string;
  scope: PortfolioScope;
  generatedAt: string;
  registry: PortfolioRegistry;
  scored: ScoredInitiative[];
  prioritization: PriorityScorecard[];
  capacity: CapacitySnapshot;
  allocations: ResourceAllocation[];
  dependencies: CrossInitiativeDependency[];
  health: PortfolioHealth;
  roadmap: RoadmapItem[];
  optimizations: OptimizationRecommendation[];
  scenarios: PortfolioScenario[];
  analytics: PortfolioAnalytics;
  explainability: {
    executiveSummary: string;
    contributingDomains: string[];
  };
  contributingDomains: string[];
  metadata: PortfolioMetadata;
}
