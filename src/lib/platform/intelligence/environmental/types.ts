import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const ENVIRONMENTAL_INTELLIGENCE_VERSION = "0.1.0";
export const ENVIRONMENTAL_CAPABILITIES = [
  "climate", "weather_risk", "natural_disaster", "environmental_regulation", "sustainability",
  "energy", "water_resources", "air_quality", "waste_management", "carbon_emissions",
  "biodiversity", "infrastructure_resilience", "facility_risk", "supply_chain_environmental_risk",
  "insurance_exposure", "environmental_funding", "esg_impact",
  "environmental_analysis", "climate_risk", "disaster_impact", "sustainability_analysis",
  "infrastructure_analysis", "environmental_trends", "environmental_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation",
  "knowledge_contribution", "closed_learning_loop",
] as const;
export const ENVIRONMENTAL_AREAS = [
  "climate", "weather_risk", "natural_disaster", "environmental_regulation", "sustainability",
  "energy", "water_resources", "air_quality", "waste_management", "carbon_emissions",
  "biodiversity", "infrastructure_resilience", "facility_risk", "supply_chain_environmental_risk",
  "insurance_exposure", "environmental_funding", "esg_impact",
] as const;
export const ENVIRONMENTAL_SCENARIOS = [
  "extreme_heat", "flooding", "drought", "wildfire", "severe_storm",
  "regulatory_tightening", "energy_shortage", "water_stress", "carbon_pricing_shock", "biodiversity_loss",
] as const;
export const ENVIRONMENTAL_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "climate_risk", "disaster_impact", "sustainability",
  "infrastructure_resilience", "resource_availability", "regulatory_exposure", "insurance_risk",
  "environmental_opportunity", "long_term_outlook",
] as const;
export const ENVIRONMENTAL_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const ENVIRONMENTAL_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const ENVIRONMENTAL_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const ENVIRONMENTAL_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const ENVIRONMENTAL_OUTLOOKS = ["resilient", "stable", "stressed", "volatile", "uncertain"] as const;

export type EnvironmentalCapability = typeof ENVIRONMENTAL_CAPABILITIES[number];
export type EnvironmentalArea = typeof ENVIRONMENTAL_AREAS[number];
export type EnvironmentalScenarioKind = typeof ENVIRONMENTAL_SCENARIOS[number];
export type EnvironmentalAnalysisKind = typeof ENVIRONMENTAL_ANALYSIS_KINDS[number];
export type EnvironmentalHealthStatus = typeof ENVIRONMENTAL_HEALTH_STATUSES[number];
export type EnvironmentalPriorityBand = typeof ENVIRONMENTAL_PRIORITY_BANDS[number];
export type EnvironmentalArtifactStatus = typeof ENVIRONMENTAL_ARTIFACT_STATUSES[number];
export type EnvironmentalConfidenceLevel = typeof ENVIRONMENTAL_CONFIDENCE_LEVELS[number];
export type EnvironmentalOutlook = typeof ENVIRONMENTAL_OUTLOOKS[number];
export type EnvironmentalMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every environmental recommendation answers these eight leadership questions. */
export interface EnvironmentalLens {
  climateRisk: string;
  facilityExposure: string;
  infrastructureResilience: string;
  resourceAvailability: string;
  sustainabilityImpact: string;
  regulatoryExposure: string;
  insuranceRisk: string;
  longTermEnvironmentalOutlook: string;
}

export interface EnvironmentalScore { key: string; label: string; value: number; status: EnvironmentalHealthStatus; band: EnvironmentalPriorityBand; narrative: string; }
export interface EnvironmentalConfidenceScore { value: number; level: EnvironmentalConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface PoliticalResultLight extends ResultLightBase { politicalScore?: { value?: number }; politicalStability?: { value?: number }; }
export interface EconomicResultLight extends ResultLightBase { economicScore?: { value?: number }; inflationPressure?: { value?: number }; }
export interface LegalComplianceRiskResultLight extends ResultLightBase {
  legalScore?: { value?: number }; complianceScore?: { value?: number }; riskScore?: { value?: number };
}
export interface OperationsResultLight extends ResultLightBase { operationsScore?: { value?: number }; costPressure?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface MarketResultLight extends ResultLightBase { marketScore?: { value?: number }; }

export interface EnvironmentalBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<EnvironmentalArea, number>;
  climateRisk: number;
  facilityExposure: number;
  resourceAvailability: number;
  sustainabilityMaturity: number;
  regulatoryExposure: number;
  insurancePressure: number;
  infrastructureResilience: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface EnvironmentalAreaRecord {
  id: string; area: EnvironmentalArea; title: string; score: number; status: EnvironmentalArtifactStatus;
  signal: string; evidence: string[]; lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalAreaSuite {
  area: EnvironmentalArea; records: EnvironmentalAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface EnvironmentalTrendRecord {
  id: string; area: EnvironmentalArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: EnvironmentalConfidenceLevel; lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalTrendSuite { trends: EnvironmentalTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface EnvironmentalForecastRecord {
  id: string; area: EnvironmentalArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: EnvironmentalConfidenceLevel; lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalForecastSuite {
  forecasts: EnvironmentalForecastRecord[]; outlook: EnvironmentalOutlook;
  maturityScore: number; narrative: string;
}

export interface EnvironmentalScenarioRecord {
  id: string; kind: EnvironmentalScenarioKind; title: string; probability: number;
  severity: EnvironmentalPriorityBand; organizationalImpact: number;
  facilityImpact: number; resourceImpact: number; monitors: string[];
  lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalScenarioSuite {
  scenarios: EnvironmentalScenarioRecord[]; primaryScenario: EnvironmentalScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface EnvironmentalAnalysisRecord {
  id: string; kind: EnvironmentalAnalysisKind; title: string; score: number;
  status: EnvironmentalArtifactStatus; lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalAnalysisSuite {
  analyses: EnvironmentalAnalysisRecord[]; kindsCovered: EnvironmentalAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface ClimateRiskRecord {
  id: string; title: string; area: EnvironmentalArea; severity: EnvironmentalPriorityBand;
  score: number; lenses: EnvironmentalLens; narrative: string;
}
export interface ClimateRiskSuite {
  records: ClimateRiskRecord[]; score: number; aggregateRisk: number; narrative: string;
}

export interface DisasterImpactRecord {
  id: string; title: string; impact: number; lenses: EnvironmentalLens; narrative: string;
}
export interface DisasterImpactSuite {
  records: DisasterImpactRecord[]; score: number; impactIndex: number; narrative: string;
}

export interface SustainabilityRecord {
  id: string; title: string; maturity: number; lenses: EnvironmentalLens; narrative: string;
}
export interface SustainabilitySuite {
  records: SustainabilityRecord[]; score: number; maturityIndex: number; narrative: string;
}

export interface InfrastructureResilienceRecord {
  id: string; title: string; resilience: number; lenses: EnvironmentalLens; narrative: string;
}
export interface InfrastructureResilienceSuite {
  records: InfrastructureResilienceRecord[]; score: number; resilienceIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: EnvironmentalPriorityBand; source: string;
  score: number; lenses: EnvironmentalLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface EnvironmentalKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: EnvironmentalMetadata;
}
export interface EnvironmentalKnowledgeContribution {
  artifacts: EnvironmentalKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"political" | "economic" | "operations" | "opportunity" | "legal-compliance-risk" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface EnvironmentalRecommendationRecord {
  id: string; title: string; priority: EnvironmentalPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalRiskRecord {
  id: string; title: string; area: EnvironmentalArea; severity: EnvironmentalPriorityBand;
  score: number; mitigation: string; lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalOpportunityRecord {
  id: string; title: string; area: EnvironmentalArea; priority: EnvironmentalPriorityBand;
  score: number; lenses: EnvironmentalLens; narrative: string;
}

export interface EnvironmentalDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<EnvironmentalArea, number>; outlook: EnvironmentalOutlook;
  climateRisk: number; facilityExposure: number; resourceAvailability: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface EnvironmentalOutlookDashboard {
  generatedAt: string; headline: string; outlook: EnvironmentalOutlook;
  overall: number; primaryScenario: EnvironmentalScenarioKind; narrative: string;
}
export interface ClimateDashboard {
  generatedAt: string; headline: string; score: number;
  aggregateRisk: number; signals: string[]; narrative: string;
}
export interface DisasterRiskDashboard {
  generatedAt: string; headline: string; score: number;
  impactIndex: number; signals: string[]; narrative: string;
}
export interface SustainabilityDashboard {
  generatedAt: string; headline: string; score: number;
  maturityIndex: number; signals: string[]; narrative: string;
}
export interface InfrastructureDashboard {
  generatedAt: string; headline: string; score: number;
  resilienceIndex: number; signals: string[]; narrative: string;
}
export interface ResourceMonitoringDashboard {
  generatedAt: string; headline: string; score: number;
  resourceAvailability: number; signals: string[]; narrative: string;
}
export interface EsgOverviewDashboard {
  generatedAt: string; headline: string; score: number;
  esgPressure: number; signals: string[]; narrative: string;
}
export interface ExecutiveEnvironmentalBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: EnvironmentalOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: EnvironmentalLens; narrative: string;
}
export interface BoardEnvironmentalReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: EnvironmentalOutlook; climateScore: number;
  sustainabilityScore: number; infrastructureResilience: number; recommendations: string[];
  lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalHealthScore {
  overallScore: number; status: EnvironmentalHealthStatus; outlook: EnvironmentalOutlook;
  areaScores: Record<EnvironmentalArea, number>; climateScore: number;
  sustainabilityScore: number; infrastructureScore: number; resourceScore: number;
  forecastScore: number; scenarioScore: number; lenses: EnvironmentalLens; narrative: string;
}
export interface EnvironmentalReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: EnvironmentalConfidenceScore; narrative: string;
}
export interface EnvironmentalProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<EnvironmentalArea, number>; outlook: EnvironmentalOutlook;
  forecast: number; dashboard: EnvironmentalDashboard; brief: ExecutiveEnvironmentalBrief;
  overallConfidence: EnvironmentalConfidenceScore;
}
export interface EnvironmentalHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: EnvironmentalArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: EnvironmentalMetadata;
}
export interface EnvironmentalPublisher { domain: string; capability: string; }
export interface EnvironmentalQueryRequest {
  question: string;
  focus?: "general" | EnvironmentalArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface EnvironmentalQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: EnvironmentalConfidenceScore;
}

export interface EnvironmentalRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  politicalResult?: PoliticalResultLight; economicResult?: EconomicResultLight;
  legalComplianceRiskResult?: LegalComplianceRiskResultLight;
  operationsResult?: OperationsResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight; marketResult?: MarketResultLight;
  baselineOverrides?: Partial<EnvironmentalBaseline>; metadata?: EnvironmentalMetadata;
}

export interface EnvironmentalResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: EnvironmentalBaseline;
  healthScore: EnvironmentalScore;
  climateScore: EnvironmentalScore;
  weatherRiskScore: EnvironmentalScore;
  naturalDisasterScore: EnvironmentalScore;
  environmentalRegulationScore: EnvironmentalScore;
  sustainabilityScore: EnvironmentalScore;
  energyScore: EnvironmentalScore;
  waterResourcesScore: EnvironmentalScore;
  airQualityScore: EnvironmentalScore;
  wasteManagementScore: EnvironmentalScore;
  carbonEmissionsScore: EnvironmentalScore;
  biodiversityScore: EnvironmentalScore;
  infrastructureResilienceScore: EnvironmentalScore;
  facilityRiskScore: EnvironmentalScore;
  supplyChainEnvironmentalRiskScore: EnvironmentalScore;
  insuranceExposureScore: EnvironmentalScore;
  environmentalFundingScore: EnvironmentalScore;
  esgImpactScore: EnvironmentalScore;
  forecastScore: EnvironmentalScore; scenarioScore: EnvironmentalScore; analysisScore: EnvironmentalScore;
  earlyWarningScore: EnvironmentalScore; climateRiskScore: EnvironmentalScore;
  disasterImpactScore: EnvironmentalScore;
  health: EnvironmentalHealthScore; dashboard: EnvironmentalDashboard;
  outlookDashboard: EnvironmentalOutlookDashboard; climateDashboard: ClimateDashboard;
  disasterRiskDashboard: DisasterRiskDashboard; sustainabilityDashboard: SustainabilityDashboard;
  infrastructureDashboard: InfrastructureDashboard; resourceMonitoringDashboard: ResourceMonitoringDashboard;
  esgOverviewDashboard: EsgOverviewDashboard;
  brief: ExecutiveEnvironmentalBrief; boardReport: BoardEnvironmentalReport;
  recommendations: EnvironmentalRecommendationRecord[]; risks: EnvironmentalRiskRecord[];
  opportunities: EnvironmentalOpportunityRecord[];
  areaSuites: Record<EnvironmentalArea, EnvironmentalAreaSuite>;
  trendSuite: EnvironmentalTrendSuite; forecastSuite: EnvironmentalForecastSuite;
  scenarioSuite: EnvironmentalScenarioSuite; analysisSuite: EnvironmentalAnalysisSuite;
  climateRiskSuite: ClimateRiskSuite;
  disasterImpactSuite: DisasterImpactSuite;
  sustainabilitySuite: SustainabilitySuite;
  infrastructureResilienceSuite: InfrastructureResilienceSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: EnvironmentalKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: EnvironmentalReasoningResult; projection: EnvironmentalProjectionResult;
  historyRecord: EnvironmentalHistoryRecord; confidence: EnvironmentalConfidenceScore;
  requestMetadata: EnvironmentalMetadata;
}
