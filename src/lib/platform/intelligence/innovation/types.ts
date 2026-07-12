/**
 * Innovation Intelligence — shared DTOs and constants (Sprint 044).
 *
 * JAG's innovation engine: continuously discover, evaluate, and prioritize
 * new ideas that improve the organization. This is NOT a suggestion box —
 * it is organizational innovation intelligence spanning ideation → experiment
 * → portfolio → roadmap. First Future Intelligence domain (foresight /
 * innovation / strategy), composing onto Market (External) and
 * Improvement/Knowledge (Internal).
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

export const INNOVATION_INTELLIGENCE_VERSION = "0.1.0";

export type InnovationMetadata = Record<string, unknown>;
export type { GraphScope };

export const INNOVATION_CAPABILITIES = [
  "idea_management",
  "research_development",
  "product_service_innovation",
  "process_innovation",
  "ai_opportunity_discovery",
  "technology_adoption",
  "emerging_technology_monitoring",
  "innovation_portfolio_management",
  "experiment_management",
  "proof_of_concept_tracking",
  "intellectual_property_tracking",
  "continuous_improvement_opportunities",
  "strategic_innovation_roadmaps",
  "recommendation_generation",
  "knowledge_contribution",
] as const;
export type InnovationCapability = (typeof INNOVATION_CAPABILITIES)[number];

export const INNOVATION_HORIZONS = ["h1_core", "h2_adjacent", "h3_transformational"] as const;
export type InnovationHorizon = (typeof INNOVATION_HORIZONS)[number];

export const IDEA_STATUSES = [
  "submitted",
  "screening",
  "validated",
  "experimenting",
  "scaling",
  "parked",
  "rejected",
] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const EXPERIMENT_STATUSES = ["planned", "running", "completed", "failed", "scaled"] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const TECHNOLOGY_RADAR_RINGS = ["adopt", "trial", "assess", "hold"] as const;
export type TechnologyRadarRing = (typeof TECHNOLOGY_RADAR_RINGS)[number];

export const IP_KINDS = ["patent", "trademark", "copyright", "trade_secret", "license"] as const;
export type IpKind = (typeof IP_KINDS)[number];

export const INNOVATION_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type InnovationConfidenceLevel = (typeof INNOVATION_CONFIDENCE_LEVELS)[number];

export const INNOVATION_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export type InnovationPriorityBand = (typeof INNOVATION_PRIORITY_BANDS)[number];

export const INNOVATION_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export type InnovationHealthStatus = (typeof INNOVATION_HEALTH_STATUSES)[number];

export const INNOVATION_ARTIFACT_STATUSES = [
  "draft",
  "assessed",
  "monitored",
  "at_risk",
  "advancing",
  "scaled",
  "deferred",
] as const;
export type InnovationArtifactStatus = (typeof INNOVATION_ARTIFACT_STATUSES)[number];

/**
 * The innovation recommendation lens (8 required fields).
 * Every recommendation and innovation record surfaces this lens.
 */
export interface InnovationLens {
  innovationOpportunityExists: string;
  evidenceSupports: string;
  problemSolved: string;
  expectedImpact: string;
  investmentRequired: string;
  experimentsValidate: string;
  risksExist: string;
  capabilitiesRequired: string;
}

export interface InnovationConfidenceScore {
  value: number;
  level: InnovationConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

export interface InnovationScore {
  key: string;
  label: string;
  value: number;
  status: InnovationHealthStatus;
  band: InnovationPriorityBand;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Soft integration light types (baseline derivation only).
 * ------------------------------------------------------------------ */

export interface MarketResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  competitivePositionScore?: { value?: number };
  expansionOpportunityScore?: { value?: number };
  baseline?: {
    whiteSpaceScore?: number;
    opportunityDensity?: number;
    technologyDisruptionPressure?: number;
    signalDensity?: number;
  };
  recommendations?: string[];
}

export interface OpportunityResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { opportunityDensity?: number; captureReadiness?: number };
  recommendations?: string[];
}

export interface KnowledgeResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  coverageScore?: { value?: number };
  contributionScore?: { value?: number };
  baseline?: { coverageScore?: number; validatedRatio?: number; gapPressure?: number };
  recommendations?: string[];
}

export interface DocumentResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  complianceScore?: { value?: number };
  riskScore?: { value?: number };
  baseline?: {
    complianceCoverage?: number;
    riskPressure?: number;
    contractDensity?: number;
    documentCount?: number;
  };
  recommendations?: string[];
}

export interface BusinessModelResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { businessModelFit?: number; valuePropositionStrength?: number; monetizationClarity?: number };
  recommendations?: string[];
}

export interface ImprovementResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: {
    improvementMomentum?: number;
    continuousImprovementScore?: number;
    initiativeThroughput?: number;
  };
  recommendations?: string[];
}

export interface DecisionResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { decisionTraceability?: number; decisionVelocity?: number; decisionQuality?: number };
  recommendations?: string[];
}

export interface PredictiveResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { growthSignal?: number; scenarioCoverage?: number };
  recommendations?: string[];
}

/* ------------------------------------------------------------------ *
 * Baseline
 * ------------------------------------------------------------------ */

export interface InnovationBaseline {
  organizationHealthScore: number;
  executionScore: number;
  ideaVelocity: number;
  rdIntensity: number;
  productInnovationScore: number;
  processInnovationScore: number;
  aiOpportunityDensity: number;
  technologyAdoptionReadiness: number;
  emergingTechAwareness: number;
  portfolioBalance: number;
  experimentThroughput: number;
  pocConversion: number;
  ipCoverage: number;
  continuousImprovementMomentum: number;
  roadmapClarity: number;
  marketSignalStrength: number;
  opportunityDensity: number;
  knowledgeContributionScore: number;
  documentInnovationCoverage: number;
  businessModelFit: number;
  improvementMomentum: number;
  decisionTraceability: number;
  predictiveGrowthSignal: number;
  ideaCount: number;
  experimentCount: number;
  pocCount: number;
  ipAssetCount: number;
  radarItemCount: number;
  h1Share: number;
  h2Share: number;
  h3Share: number;
}

/* ------------------------------------------------------------------ *
 * Idea Management Intelligence
 * ------------------------------------------------------------------ */

export interface IdeaRecord {
  id: string;
  title: string;
  status: IdeaStatus;
  horizon: InnovationHorizon;
  score: number;
  impactEstimate: number;
  investmentEstimate: number;
  owner: string;
  narrative: string;
  lenses: InnovationLens;
}

export interface IdeaManagementSuite {
  ideas: IdeaRecord[];
  velocityScore: number;
  backlogHealth: number;
  screeningThroughput: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Research & Development Intelligence
 * ------------------------------------------------------------------ */

export interface RdInitiativeRecord {
  id: string;
  name: string;
  intensity: number;
  maturity: string;
  investmentIndex: number;
  narrative: string;
}

export interface ResearchDevelopmentSuite {
  initiatives: RdInitiativeRecord[];
  intensityScore: number;
  pipelineDepth: number;
  capabilityCoverage: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Product / Service Innovation Intelligence
 * ------------------------------------------------------------------ */

export interface ProductServiceInnovationRecord {
  id: string;
  name: string;
  type: "product" | "service";
  noveltyScore: number;
  readiness: number;
  narrative: string;
  lenses: InnovationLens;
}

export interface ProductServiceInnovationSuite {
  innovations: ProductServiceInnovationRecord[];
  innovationScore: number;
  noveltyIndex: number;
  launchReadiness: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Process Innovation Intelligence
 * ------------------------------------------------------------------ */

export interface ProcessInnovationRecord {
  id: string;
  process: string;
  efficiencyGain: number;
  adoptionScore: number;
  narrative: string;
  lenses: InnovationLens;
}

export interface ProcessInnovationSuite {
  processes: ProcessInnovationRecord[];
  innovationScore: number;
  efficiencyIndex: number;
  adoptionPressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * AI Opportunity Intelligence
 * ------------------------------------------------------------------ */

export interface AiOpportunityRecord {
  id: string;
  opportunity: string;
  density: number;
  feasibility: number;
  impactEstimate: number;
  narrative: string;
  lenses: InnovationLens;
}

export interface AiOpportunitySuite {
  opportunities: AiOpportunityRecord[];
  densityScore: number;
  feasibilityIndex: number;
  priorityCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Technology Adoption Intelligence
 * ------------------------------------------------------------------ */

export interface TechnologyAdoptionRecord {
  id: string;
  technology: string;
  readiness: number;
  adoptionStage: string;
  riskScore: number;
  narrative: string;
}

export interface TechnologyAdoptionSuite {
  technologies: TechnologyAdoptionRecord[];
  readinessScore: number;
  adoptionVelocity: number;
  frictionPressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Emerging Technology Intelligence
 * ------------------------------------------------------------------ */

export interface EmergingTechnologyRecord {
  id: string;
  technology: string;
  awareness: number;
  disruptionPotential: number;
  horizonFit: InnovationHorizon;
  narrative: string;
}

export interface EmergingTechnologySuite {
  technologies: EmergingTechnologyRecord[];
  awarenessScore: number;
  disruptionIndex: number;
  watchlistCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Innovation Portfolio Intelligence
 * ------------------------------------------------------------------ */

export interface PortfolioItemRecord {
  id: string;
  name: string;
  horizon: InnovationHorizon;
  allocation: number;
  health: number;
  narrative: string;
  lenses: InnovationLens;
}

export interface InnovationPortfolioSuite {
  items: PortfolioItemRecord[];
  balanceScore: number;
  h1Share: number;
  h2Share: number;
  h3Share: number;
  narrative: string;
}

export interface InnovationPortfolioResult {
  generatedAt: string;
  headline: string;
  balanceScore: number;
  h1Share: number;
  h2Share: number;
  h3Share: number;
  itemCount: number;
  topItems: string[];
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Experiment Management Intelligence
 * ------------------------------------------------------------------ */

export interface ExperimentRecord {
  id: string;
  name: string;
  status: ExperimentStatus;
  throughputContribution: number;
  learningValue: number;
  narrative: string;
  lenses: InnovationLens;
}

export interface ExperimentManagementSuite {
  experiments: ExperimentRecord[];
  throughputScore: number;
  runningCount: number;
  successRate: number;
  narrative: string;
}

export interface ExperimentDashboardResult {
  generatedAt: string;
  headline: string;
  throughputScore: number;
  runningCount: number;
  completedCount: number;
  successRate: number;
  topExperiments: string[];
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Proof of Concept Intelligence
 * ------------------------------------------------------------------ */

export interface PocRecord {
  id: string;
  name: string;
  conversionLikelihood: number;
  stage: string;
  investmentEstimate: number;
  narrative: string;
  lenses: InnovationLens;
}

export interface ProofOfConceptSuite {
  pocs: PocRecord[];
  conversionScore: number;
  activeCount: number;
  graduationPressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Intellectual Property Intelligence
 * ------------------------------------------------------------------ */

export interface IpAssetRecord {
  id: string;
  title: string;
  kind: IpKind;
  coverageScore: number;
  status: InnovationArtifactStatus;
  narrative: string;
}

export interface IntellectualPropertySuite {
  assets: IpAssetRecord[];
  coverageScore: number;
  protectionDepth: number;
  exposurePressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Continuous Improvement Intelligence
 * ------------------------------------------------------------------ */

export interface ContinuousImprovementRecord {
  id: string;
  opportunity: string;
  momentum: number;
  impactEstimate: number;
  narrative: string;
  lenses: InnovationLens;
}

export interface ContinuousImprovementSuite {
  opportunities: ContinuousImprovementRecord[];
  momentumScore: number;
  opportunityCount: number;
  throughputIndex: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Strategic Roadmap Intelligence
 * ------------------------------------------------------------------ */

export interface RoadmapMilestoneRecord {
  id: string;
  title: string;
  horizon: InnovationHorizon;
  clarity: number;
  duePeriod: string;
  narrative: string;
  lenses: InnovationLens;
}

export interface StrategicRoadmapSuite {
  milestones: RoadmapMilestoneRecord[];
  clarityScore: number;
  horizonCoverage: number;
  sequencingHealth: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Pipeline / backlog / radar
 * ------------------------------------------------------------------ */

export interface InnovationPipelineStage {
  stage: IdeaStatus;
  count: number;
  narrative: string;
}

export interface InnovationPipelineResult {
  generatedAt: string;
  headline: string;
  stages: InnovationPipelineStage[];
  totalIdeas: number;
  advancingCount: number;
  narrative: string;
}

export interface IdeaBacklogResult {
  generatedAt: string;
  headline: string;
  prioritizedIdeas: IdeaRecord[];
  backlogHealth: number;
  topIdea: string | null;
  narrative: string;
}

export interface TechnologyRadarItem {
  id: string;
  name: string;
  ring: TechnologyRadarRing;
  score: number;
  narrative: string;
}

export interface TechnologyRadarResult {
  generatedAt: string;
  headline: string;
  items: TechnologyRadarItem[];
  adoptCount: number;
  trialCount: number;
  assessCount: number;
  holdCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Reasoning
 * ------------------------------------------------------------------ */

export interface InnovationReasoningResult {
  answer: string;
  connectedIdeas: string[];
  connectedExperiments: string[];
  missingTopics: string[];
  confidence: InnovationConfidenceScore;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Knowledge contribution
 * ------------------------------------------------------------------ */

export interface InnovationKnowledgeDraft {
  id: string;
  type: string;
  title: string;
  confidence: number;
  sourceRef: string;
  validated: boolean;
  metadata: InnovationMetadata;
}

export interface InnovationKnowledgeContribution {
  artifacts: InnovationKnowledgeDraft[];
  contributionScore: number;
  validatedCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Health, dashboards, briefs
 * ------------------------------------------------------------------ */

export interface InnovationHealthResult {
  overallScore: number;
  status: InnovationHealthStatus;
  dimensions: Record<string, number>;
  lenses: InnovationLens;
  narrative: string;
}

export interface InnovationDashboardResult {
  generatedAt: string;
  headline: string;
  overall: number;
  pipelineScore: number;
  experimentScore: number;
  portfolioScore: number;
  radarScore: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface PipelineDashboardResult {
  generatedAt: string;
  headline: string;
  pipelineScore: number;
  ideaCount: number;
  advancingCount: number;
  backlogHealth: number;
  narrative: string;
}

export interface PortfolioDashboardResult {
  generatedAt: string;
  headline: string;
  balanceScore: number;
  h1Share: number;
  h2Share: number;
  h3Share: number;
  itemCount: number;
  narrative: string;
}

export interface RadarDashboardResult {
  generatedAt: string;
  headline: string;
  radarScore: number;
  adoptCount: number;
  trialCount: number;
  assessCount: number;
  holdCount: number;
  narrative: string;
}

export interface InnovationRiskRecord {
  id: string;
  title: string;
  category: string;
  severity: InnovationPriorityBand;
  score: number;
  mitigation: string;
  lenses: InnovationLens;
  narrative: string;
}

export interface InnovationOpportunityRecord {
  id: string;
  title: string;
  priority: InnovationPriorityBand;
  score: number;
  expectedImpact: number;
  investmentEstimate: number;
  lenses: InnovationLens;
  narrative: string;
}

/**
 * An innovation recommendation. Carries the 8-field lens plus evidence,
 * confidence, risk, impact/investment estimates, experiments, capabilities,
 * owner, due date, and priority.
 */
export interface InnovationRecommendationRecord {
  id: string;
  title: string;
  priority: InnovationPriorityBand;
  evidenceRefs: string[];
  confidenceScore: number;
  riskScore: number;
  impactEstimate: number;
  investmentEstimate: number;
  experimentRefs: string[];
  capabilitiesRequired: string[];
  owner: string;
  dueDate: string;
  rationale: string;
  action: string;
  lenses: InnovationLens;
  narrative: string;
}

export interface ExecutiveInnovationBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  healthScore: number;
  pipelineScore: number;
  experimentScore: number;
  portfolioScore: number;
  radarScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  topIdea: string | null;
  lenses: InnovationLens;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Projection / history / query
 * ------------------------------------------------------------------ */

export interface InnovationProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  pipelineScore: number;
  experimentScore: number;
  portfolioScore: number;
  radarScore: number;
  ideaScore: number;
  rdScore: number;
  productServiceScore: number;
  processScore: number;
  aiOpportunityScore: number;
  technologyAdoptionScore: number;
  emergingTechScore: number;
  pocScore: number;
  ipScore: number;
  continuousImprovementScore: number;
  roadmapScore: number;
  dashboard: InnovationDashboardResult;
  pipelineDashboard: PipelineDashboardResult;
  experimentDashboard: ExperimentDashboardResult;
  portfolioDashboard: PortfolioDashboardResult;
  radarDashboard: RadarDashboardResult;
  brief: ExecutiveInnovationBrief;
  metrics: {
    ideaCount: number;
    experimentCount: number;
    pocCount: number;
    ipAssetCount: number;
    radarItemCount: number;
    h1Share: number;
    h2Share: number;
    h3Share: number;
  };
  overallConfidence: InnovationConfidenceScore;
}

export interface InnovationHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: InnovationArtifactStatus;
  healthScore: number;
  pipelineScore: number;
  portfolioScore: number;
  generatedAt: string;
  summary: string;
  metadata: InnovationMetadata;
}

export interface InnovationQueryRequest {
  question: string;
  focus?:
    | "general"
    | "ideas"
    | "rd"
    | "product"
    | "process"
    | "ai"
    | "adoption"
    | "emerging"
    | "portfolio"
    | "experiments"
    | "poc"
    | "ip"
    | "improvement"
    | "roadmap"
    | "recommendations"
    | "reasoning";
  maxResults?: number;
}

export interface InnovationQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: InnovationConfidenceScore;
}

export interface InnovationPublisher {
  domain: string;
  capability: string;
}

/* ------------------------------------------------------------------ *
 * Request / Result
 * ------------------------------------------------------------------ */

export interface InnovationRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dna?: OrganizationDNA;
  dnaResult?: OrganizationDnaResult;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  predictionResult?: PredictionResult | PredictiveResultLight;
  marketResult?: MarketResultLight;
  opportunityResult?: OpportunityResultLight;
  knowledgeResult?: KnowledgeResultLight;
  documentResult?: DocumentResultLight;
  businessModelResult?: BusinessModelResultLight;
  improvementResult?: ImprovementResultLight;
  decisionResult?: DecisionResultLight;
  baselineOverrides?: Partial<InnovationBaseline>;
  metadata?: InnovationMetadata;
}

export interface InnovationResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: InnovationBaseline;
  healthScore: InnovationScore;
  pipelineScore: InnovationScore;
  experimentScore: InnovationScore;
  portfolioScore: InnovationScore;
  radarScore: InnovationScore;
  ideaScore: InnovationScore;
  rdScore: InnovationScore;
  productServiceScore: InnovationScore;
  processScore: InnovationScore;
  aiOpportunityScore: InnovationScore;
  technologyAdoptionScore: InnovationScore;
  emergingTechScore: InnovationScore;
  pocScore: InnovationScore;
  ipScore: InnovationScore;
  continuousImprovementScore: InnovationScore;
  roadmapScore: InnovationScore;
  knowledgeScore: InnovationScore;
  health: InnovationHealthResult;
  brief: ExecutiveInnovationBrief;
  projection: InnovationProjectionResult;
  confidence: InnovationConfidenceScore;
  dashboard: InnovationDashboardResult;
  innovationPipeline: InnovationPipelineResult;
  ideaBacklog: IdeaBacklogResult;
  experimentDashboard: ExperimentDashboardResult;
  innovationPortfolio: InnovationPortfolioResult;
  technologyRadar: TechnologyRadarResult;
  recommendations: InnovationRecommendationRecord[];
  risks: InnovationRiskRecord[];
  opportunities: InnovationOpportunityRecord[];
  historyRecord: InnovationHistoryRecord;
  ideaManagement: IdeaManagementSuite;
  researchDevelopment: ResearchDevelopmentSuite;
  productServiceInnovation: ProductServiceInnovationSuite;
  processInnovation: ProcessInnovationSuite;
  aiOpportunity: AiOpportunitySuite;
  technologyAdoption: TechnologyAdoptionSuite;
  emergingTechnology: EmergingTechnologySuite;
  innovationPortfolioSuite: InnovationPortfolioSuite;
  experimentManagement: ExperimentManagementSuite;
  proofOfConcept: ProofOfConceptSuite;
  intellectualProperty: IntellectualPropertySuite;
  continuousImprovement: ContinuousImprovementSuite;
  strategicRoadmap: StrategicRoadmapSuite;
  knowledgeContribution: InnovationKnowledgeContribution;
  reasoning: InnovationReasoningResult;
  requestMetadata: InnovationMetadata;
}
