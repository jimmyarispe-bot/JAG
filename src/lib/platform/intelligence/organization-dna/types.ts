/**
 * Organizational DNA & Company Builder — shared types / DTOs (Sprint 030).
 *
 * Foundational organizational profile that every future intelligence domain
 * consumes: identity, stage, lifecycle, business model, readiness, and roadmap.
 */

import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";

/** Semantic version of the Organizational DNA & Company Builder pack. */
export const ORGANIZATION_DNA_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type OrganizationDnaMetadata = Record<string, unknown>;

/** Re-export graph scope for DNA records. */
export type { GraphScope };

/** Organization lifecycle stages. */
export const ORGANIZATION_STAGES = [
  "idea",
  "startup",
  "operating",
  "growth",
  "turnaround",
  "acquisition",
  "exit",
] as const;
export type OrganizationStage = (typeof ORGANIZATION_STAGES)[number];

/** Confidence bands used across DNA artifacts. */
export const DNA_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type DnaConfidenceLevel = (typeof DNA_CONFIDENCE_LEVELS)[number];

/** Priority / severity bands. */
export const DNA_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type DnaPriorityBand = (typeof DNA_PRIORITY_BANDS)[number];

/** Readiness / health status bands. */
export const READINESS_STATUSES = [
  "ready",
  "nearly_ready",
  "developing",
  "nascent",
  "blocked",
] as const;
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];

/** Artifact lifecycle statuses. */
export const DNA_ARTIFACT_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "approved",
  "archived",
  "superseded",
] as const;
export type DnaArtifactStatus = (typeof DNA_ARTIFACT_STATUSES)[number];

/** Business model archetypes. */
export const BUSINESS_MODEL_ARCHETYPES = [
  "subscription",
  "transaction",
  "marketplace",
  "services",
  "licensing",
  "hybrid",
  "nonprofit",
  "education",
] as const;
export type BusinessModelArchetype =
  (typeof BUSINESS_MODEL_ARCHETYPES)[number];

/** Revenue stream kinds. */
export const REVENUE_STREAM_KINDS = [
  "tuition",
  "subscription",
  "one_time",
  "usage",
  "licensing",
  "grants",
  "donations",
  "services",
  "ancillary",
] as const;
export type RevenueStreamKind = (typeof REVENUE_STREAM_KINDS)[number];

/** Funding model kinds. */
export const FUNDING_MODEL_KINDS = [
  "bootstrapped",
  "friends_family",
  "angel",
  "venture",
  "debt",
  "grants",
  "revenue",
  "hybrid",
] as const;
export type FundingModelKind = (typeof FUNDING_MODEL_KINDS)[number];

/** Company Builder seed artifact kinds. */
export const COMPANY_BUILDER_ARTIFACT_KINDS = [
  "organizational_dna",
  "executive_blueprint",
  "organizational_roadmap",
  "business_model",
  "lean_canvas",
  "swot",
  "value_proposition",
  "customer_personas",
  "company_readiness_report",
  "executive_priorities",
  "organizational_score",
  "kpi_recommendations",
] as const;
export type CompanyBuilderArtifactKind =
  (typeof COMPANY_BUILDER_ARTIFACT_KINDS)[number];

/** Calibrated DNA confidence. */
export interface DnaConfidenceScore {
  value: number;
  level: DnaConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Mission statement. */
export interface OrganizationMission {
  statement: string;
  purpose: string;
  beneficiaries: string[];
  narrative: string;
}

/** Vision statement. */
export interface OrganizationVision {
  statement: string;
  horizonYears: number;
  aspirations: string[];
  narrative: string;
}

/** Core values. */
export interface OrganizationValues {
  values: Array<{
    id: string;
    name: string;
    description: string;
    behaviors: string[];
  }>;
  narrative: string;
}

/** Culture profile. */
export interface OrganizationCulture {
  style: string;
  traits: string[];
  decisionStyle: string;
  communicationStyle: string;
  riskTolerance: DnaPriorityBand;
  narrative: string;
}

/** Organizational goals. */
export interface OrganizationalGoals {
  northStar: string;
  goals: Array<{
    id: string;
    title: string;
    horizon: "near" | "mid" | "long";
    metric: string | null;
    target: string | null;
    priority: DnaPriorityBand;
  }>;
  narrative: string;
}

/** Organizational constraints. */
export interface OrganizationConstraints {
  constraints: Array<{
    id: string;
    category: string;
    description: string;
    severity: DnaPriorityBand;
    mitigation: string | null;
  }>;
  narrative: string;
}

/** Organizational capabilities. */
export interface OrganizationCapabilities {
  capabilities: Array<{
    id: string;
    domain: string;
    name: string;
    maturity: number;
    status: ReadinessStatus;
    evidence: string;
  }>;
  narrative: string;
}

/** Customer persona. */
export interface CustomerPersona {
  id: string;
  name: string;
  role: string;
  segment: string;
  pains: string[];
  gains: string[];
  jobs: string[];
  channels: string[];
  narrative: string;
}

/** Value proposition. */
export interface ValueProposition {
  statement: string;
  customerJobs: string[];
  painsRelieved: string[];
  gainsCreated: string[];
  differentiators: string[];
  narrative: string;
}

/** Revenue stream. */
export interface RevenueStream {
  id: string;
  kind: RevenueStreamKind;
  name: string;
  description: string;
  shareEstimate: number;
  pricingModel: string;
}

/** Revenue model. */
export interface RevenueModel {
  primaryKind: RevenueStreamKind;
  streams: RevenueStream[];
  pricingSummary: string;
  unitEconomics: string;
  narrative: string;
}

/** Funding model. */
export interface FundingModel {
  primaryKind: FundingModelKind;
  stages: Array<{
    stage: OrganizationStage;
    kind: FundingModelKind;
    amountHint: string | null;
    purpose: string;
  }>;
  runwayMonths: number | null;
  narrative: string;
}

/** Go-to-market plan. */
export interface GoToMarketPlan {
  beachhead: string;
  channels: Array<{
    id: string;
    name: string;
    role: "primary" | "secondary" | "experimental";
    costBand: DnaPriorityBand;
  }>;
  messaging: string[];
  milestones: Array<{
    id: string;
    title: string;
    horizon: string;
    successMetric: string;
  }>;
  narrative: string;
}

/** Lean canvas. */
export interface LeanCanvas {
  problem: string[];
  customerSegments: string[];
  uniqueValueProposition: string;
  solution: string[];
  channels: string[];
  revenueStreams: string[];
  costStructure: string[];
  keyMetrics: string[];
  unfairAdvantage: string;
  narrative: string;
}

/** SWOT analysis. */
export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  narrative: string;
  priorityActions: string[];
}

/** Business model. */
export interface BusinessModel {
  archetype: BusinessModelArchetype;
  valueProposition: ValueProposition;
  customerSegments: string[];
  channels: string[];
  revenueModel: RevenueModel;
  costDrivers: string[];
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  narrative: string;
}

/** Business plan summary. */
export interface BusinessPlan {
  executiveSummary: string;
  marketOpportunity: string;
  offering: string;
  goToMarket: string;
  operations: string;
  financialOutlook: string;
  risks: string[];
  milestones: string[];
  narrative: string;
}

/** Company readiness dimension. */
export interface ReadinessDimension {
  id: string;
  key: string;
  label: string;
  score: number;
  status: ReadinessStatus;
  weight: number;
  findings: string[];
  gaps: string[];
}

/** Company readiness assessment. */
export interface CompanyReadinessAssessment {
  overallScore: number;
  status: ReadinessStatus;
  dimensions: ReadinessDimension[];
  blockers: string[];
  accelerators: string[];
  narrative: string;
}

/** Readiness scoring breakdown. */
export interface ReadinessScoring {
  overallScore: number;
  status: ReadinessStatus;
  weightedScores: Array<{
    key: string;
    label: string;
    score: number;
    weight: number;
    contribution: number;
  }>;
  confidence: DnaConfidenceScore;
}

/** Executive roadmap milestone. */
export interface RoadmapMilestone {
  id: string;
  title: string;
  stage: OrganizationStage;
  horizon: string;
  priority: DnaPriorityBand;
  ownerRole: string;
  successMetric: string;
  dependencies: string[];
}

/** Executive roadmap. */
export interface ExecutiveRoadmap {
  currentStage: OrganizationStage;
  nextStage: OrganizationStage | null;
  milestones: RoadmapMilestone[];
  priorities: string[];
  narrative: string;
}

/** Organization blueprint (executive). */
export interface OrganizationBlueprint {
  title: string;
  stage: OrganizationStage;
  mission: string;
  vision: string;
  valueProposition: string;
  operatingModel: string;
  orgDesignHints: string[];
  capabilityGaps: string[];
  first90Days: string[];
  narrative: string;
}

/** KPI recommendation. */
export interface KpiRecommendation {
  id: string;
  key: string;
  label: string;
  domain: string;
  rationale: string;
  targetHint: string | null;
  priority: DnaPriorityBand;
  stageRelevance: OrganizationStage[];
}

/** Executive priority. */
export interface ExecutivePriority {
  id: string;
  title: string;
  rationale: string;
  priority: DnaPriorityBand;
  horizon: "immediate" | "near" | "mid";
  ownerRole: string;
  relatedStage: OrganizationStage;
}

/** Organizational scorecard. */
export interface OrganizationalScore {
  overall: number;
  identity: number;
  market: number;
  model: number;
  readiness: number;
  execution: number;
  status: ReadinessStatus;
  narrative: string;
}

/** Seed / profile inputs for Company Builder. */
export interface CompanyBuilderSeed {
  name?: string;
  legalName?: string;
  industry?: string;
  sector?: string;
  geography?: string;
  foundingYear?: number | null;
  ideaSummary?: string;
  problemStatement?: string;
  targetCustomer?: string;
  solutionSummary?: string;
  stageHint?: OrganizationStage | null;
  missionHint?: string | null;
  visionHint?: string | null;
  valuesHints?: string[];
  cultureHints?: string[];
  goalHints?: string[];
  constraintHints?: string[];
  capabilityHints?: string[];
  revenueHints?: string[];
  fundingHints?: string[];
  channelHints?: string[];
  competitorHints?: string[];
  teamSizeHint?: number | null;
  capitalHint?: number | null;
}

/** Full organization profile. */
export interface OrganizationProfile {
  id: string;
  name: string;
  legalName: string | null;
  industry: string;
  sector: string;
  geography: string;
  foundingYear: number | null;
  stage: OrganizationStage;
  mission: OrganizationMission;
  vision: OrganizationVision;
  values: OrganizationValues;
  culture: OrganizationCulture;
  goals: OrganizationalGoals;
  constraints: OrganizationConstraints;
  capabilities: OrganizationCapabilities;
  personas: CustomerPersona[];
  narrative: string;
}

/**
 * Organizational DNA — the canonical identity + operating genotype
 * consumed by every intelligence module.
 */
export interface OrganizationDNA {
  id: string;
  version: string;
  profileId: string;
  stage: OrganizationStage;
  previousStage: OrganizationStage | null;
  nextStage: OrganizationStage | null;
  profile: OrganizationProfile;
  businessModel: BusinessModel;
  leanCanvas: LeanCanvas;
  swot: SwotAnalysis;
  valueProposition: ValueProposition;
  revenueModel: RevenueModel;
  fundingModel: FundingModel;
  goToMarket: GoToMarketPlan;
  readiness: CompanyReadinessAssessment;
  scoring: ReadinessScoring;
  blueprint: OrganizationBlueprint;
  roadmap: ExecutiveRoadmap;
  businessPlan: BusinessPlan;
  priorities: ExecutivePriority[];
  score: OrganizationalScore;
  kpiRecommendations: KpiRecommendation[];
  confidence: DnaConfidenceScore;
  generatedAt: string;
  scope: GraphScope;
  metadata: OrganizationDnaMetadata;
}

/** Baseline signals when upstream modules are sparse. */
export interface OrganizationDnaBaseline {
  organizationHealthScore: number;
  financialHealthScore: number;
  founderHealthScore: number;
  enrollment: number;
  revenue: number;
  teamSize: number;
  riskScore: number;
  complianceScore: number;
  missionClarity: number;
  marketClarity: number;
  modelClarity: number;
  executionReadiness: number;
  capitalAdequacy: number;
}

/** History / audit record. */
export interface OrganizationDnaHistoryRecord {
  id: string;
  requestId: string;
  generatedAt: string;
  status: DnaArtifactStatus;
  dnaId: string;
  stage: OrganizationStage;
  summary: string;
  scope: GraphScope;
  confidence: DnaConfidenceScore;
}

/** Company Builder artifact envelope. */
export interface CompanyBuilderArtifact {
  id: string;
  kind: CompanyBuilderArtifactKind;
  title: string;
  status: DnaArtifactStatus;
  generatedAt: string;
  summary: string;
  payload: OrganizationDnaMetadata;
}

/** Query against a DNA result. */
export interface OrganizationDnaQueryRequest {
  question: string;
  focus?:
    | "dna"
    | "stage"
    | "readiness"
    | "roadmap"
    | "model"
    | "swot"
    | "priorities"
    | "kpis"
    | "general";
}

export interface OrganizationDnaQueryResult {
  question: string;
  answer: string;
  references: string[];
  focus: string;
}

/** Projection summary for dashboards. */
export interface OrganizationDnaProjectionResult {
  headline: string;
  stage: OrganizationStage;
  readinessStatus: ReadinessStatus;
  organizationalScore: number;
  topPriorities: string[];
  topKpis: string[];
  metrics: {
    personaCount: number;
    milestoneCount: number;
    kpiCount: number;
    priorityCount: number;
    artifactCount: number;
  };
}

/** Primary DNA / Company Builder request. */
export interface OrganizationDnaRequest {
  requestId: string;
  question?: string;
  seed?: CompanyBuilderSeed;
  artifactKinds?: CompanyBuilderArtifactKind[];
  scope?: GraphScope;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult;
  predictionResult?: PredictionResult;
  governanceResult?: GovernanceResult;
  baselineOverrides?: Partial<OrganizationDnaBaseline>;
  stageOverride?: OrganizationStage | null;
  metadata?: OrganizationDnaMetadata;
}

/** Full DNA / Company Builder result. */
export interface OrganizationDnaResult {
  requestId: string;
  version: string;
  generatedAt: string;
  scope: GraphScope;
  dna: OrganizationDNA;
  profile: OrganizationProfile;
  artifacts: CompanyBuilderArtifact[];
  projection: OrganizationDnaProjectionResult;
  confidence: DnaConfidenceScore;
  historyRecord: OrganizationDnaHistoryRecord;
  recommendations: string[];
}
