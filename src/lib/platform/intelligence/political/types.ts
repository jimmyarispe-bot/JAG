import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const POLITICAL_INTELLIGENCE_VERSION = "0.1.0";
export const POLITICAL_CAPABILITIES = [
  "legislative", "regulatory", "government_policy", "elections_leadership", "public_funding",
  "tax_policy", "education_policy", "healthcare_policy", "labor_employment_policy",
  "international_relations", "trade_tariffs", "immigration_policy", "judicial_decisions",
  "government_contracting", "public_sentiment", "lobbying_advocacy", "geopolitical_risk",
  "policy_analysis", "legislative_tracking", "regulatory_impact", "political_risk",
  "government_funding_analysis", "political_trends", "political_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation",
  "knowledge_contribution", "closed_learning_loop",
] as const;
export const POLITICAL_AREAS = [
  "legislative", "regulatory", "government_policy", "elections_leadership", "public_funding",
  "tax_policy", "education_policy", "healthcare_policy", "labor_employment_policy",
  "international_relations", "trade_tariffs", "immigration_policy", "judicial_decisions",
  "government_contracting", "public_sentiment", "lobbying_advocacy", "geopolitical_risk",
] as const;
export const POLITICAL_SCENARIOS = [
  "legislative_shock", "regulatory_tightening", "election_turnover", "funding_freeze",
  "tax_reform", "trade_conflict", "immigration_policy_shift", "judicial_reversal",
  "geopolitical_crisis", "public_sentiment_swing",
] as const;
export const POLITICAL_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "policy_analysis", "legislative_tracking",
  "regulatory_impact", "political_risk", "government_funding", "early_warning",
  "compliance_pressure", "political_opportunity", "strategic_timing",
] as const;
export const POLITICAL_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const POLITICAL_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const POLITICAL_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const POLITICAL_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const POLITICAL_OUTLOOKS = ["stable", "constructive", "contested", "volatile", "uncertain"] as const;

export type PoliticalCapability = typeof POLITICAL_CAPABILITIES[number];
export type PoliticalArea = typeof POLITICAL_AREAS[number];
export type PoliticalScenarioKind = typeof POLITICAL_SCENARIOS[number];
export type PoliticalAnalysisKind = typeof POLITICAL_ANALYSIS_KINDS[number];
export type PoliticalHealthStatus = typeof POLITICAL_HEALTH_STATUSES[number];
export type PoliticalPriorityBand = typeof POLITICAL_PRIORITY_BANDS[number];
export type PoliticalArtifactStatus = typeof POLITICAL_ARTIFACT_STATUSES[number];
export type PoliticalConfidenceLevel = typeof POLITICAL_CONFIDENCE_LEVELS[number];
export type PoliticalOutlook = typeof POLITICAL_OUTLOOKS[number];
export type PoliticalMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every political recommendation answers these eight leadership questions. */
export interface PoliticalLens {
  legislativeImpact: string;
  regulatoryRisk: string;
  governmentFundingOpportunity: string;
  taxExposure: string;
  politicalStability: string;
  tradeImpact: string;
  compliancePressure: string;
  strategicTiming: string;
}

export interface PoliticalScore { key: string; label: string; value: number; status: PoliticalHealthStatus; band: PoliticalPriorityBand; narrative: string; }
export interface PoliticalConfidenceScore { value: number; level: PoliticalConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface MarketResultLight extends ResultLightBase { marketScore?: { value?: number }; }
export interface EconomicResultLight extends ResultLightBase { economicScore?: { value?: number }; inflationPressure?: { value?: number }; }
export interface CompetitiveResultLight extends ResultLightBase { competitiveScore?: { value?: number }; competitivePressure?: { value?: number }; }
export interface LegalComplianceRiskResultLight extends ResultLightBase {
  legalScore?: { value?: number }; complianceScore?: { value?: number }; riskScore?: { value?: number };
}
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface FundingResultLight extends ResultLightBase { fundingScore?: { value?: number }; capitalAvailability?: { value?: number }; }

export interface PoliticalBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<PoliticalArea, number>;
  legislativePressure: number;
  regulatoryBurden: number;
  fundingOpportunity: number;
  politicalStability: number;
  geopoliticalRisk: number;
  compliancePressure: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface PoliticalAreaRecord {
  id: string; area: PoliticalArea; title: string; score: number; status: PoliticalArtifactStatus;
  signal: string; evidence: string[]; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalAreaSuite {
  area: PoliticalArea; records: PoliticalAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface PoliticalTrendRecord {
  id: string; area: PoliticalArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: PoliticalConfidenceLevel; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalTrendSuite { trends: PoliticalTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface PoliticalForecastRecord {
  id: string; area: PoliticalArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: PoliticalConfidenceLevel; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalForecastSuite {
  forecasts: PoliticalForecastRecord[]; outlook: PoliticalOutlook;
  maturityScore: number; narrative: string;
}

export interface PoliticalScenarioRecord {
  id: string; kind: PoliticalScenarioKind; title: string; probability: number;
  severity: PoliticalPriorityBand; organizationalImpact: number;
  fundingImpact: number; complianceImpact: number; monitors: string[];
  lenses: PoliticalLens; narrative: string;
}
export interface PoliticalScenarioSuite {
  scenarios: PoliticalScenarioRecord[]; primaryScenario: PoliticalScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface PoliticalAnalysisRecord {
  id: string; kind: PoliticalAnalysisKind; title: string; score: number;
  status: PoliticalArtifactStatus; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalAnalysisSuite {
  analyses: PoliticalAnalysisRecord[]; kindsCovered: PoliticalAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface LegislativeTrackingRecord {
  id: string; title: string; status: string; score: number; lenses: PoliticalLens; narrative: string;
}
export interface LegislativeTrackingSuite {
  records: LegislativeTrackingRecord[]; score: number; activeCount: number; narrative: string;
}

export interface RegulatoryImpactRecord {
  id: string; title: string; impact: number; lenses: PoliticalLens; narrative: string;
}
export interface RegulatoryImpactSuite {
  records: RegulatoryImpactRecord[]; score: number; pressure: number; narrative: string;
}

export interface PoliticalRiskRecordItem {
  id: string; title: string; area: PoliticalArea; severity: PoliticalPriorityBand;
  score: number; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalRiskSuite {
  records: PoliticalRiskRecordItem[]; score: number; aggregateRisk: number; narrative: string;
}

export interface GovernmentFundingRecord {
  id: string; title: string; opportunity: number; lenses: PoliticalLens; narrative: string;
}
export interface GovernmentFundingSuite {
  records: GovernmentFundingRecord[]; score: number; opportunityIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: PoliticalPriorityBand; source: string;
  score: number; lenses: PoliticalLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface PoliticalKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: PoliticalMetadata;
}
export interface PoliticalKnowledgeContribution {
  artifacts: PoliticalKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"market" | "economic" | "competitive" | "opportunity" | "legal-compliance-risk" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface PoliticalRecommendationRecord {
  id: string; title: string; priority: PoliticalPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalRiskRecord {
  id: string; title: string; area: PoliticalArea; severity: PoliticalPriorityBand;
  score: number; mitigation: string; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalOpportunityRecord {
  id: string; title: string; area: PoliticalArea; priority: PoliticalPriorityBand;
  score: number; lenses: PoliticalLens; narrative: string;
}

export interface PoliticalDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<PoliticalArea, number>; outlook: PoliticalOutlook;
  legislativePressure: number; regulatoryBurden: number; fundingOpportunity: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface PoliticalOutlookDashboard {
  generatedAt: string; headline: string; outlook: PoliticalOutlook;
  overall: number; primaryScenario: PoliticalScenarioKind; narrative: string;
}
export interface RegulatoryDashboard {
  generatedAt: string; headline: string; score: number;
  pressure: number; signals: string[]; narrative: string;
}
export interface LegislativeDashboard {
  generatedAt: string; headline: string; score: number;
  activeBills: number; signals: string[]; narrative: string;
}
export interface FundingOpportunitiesDashboard {
  generatedAt: string; headline: string; score: number;
  opportunityIndex: number; signals: string[]; narrative: string;
}
export interface PoliticalRiskDashboard {
  generatedAt: string; headline: string; score: number;
  aggregateRisk: number; signals: string[]; narrative: string;
}
export interface TradeInternationalDashboard {
  generatedAt: string; headline: string; score: number;
  tradeImpact: number; signals: string[]; narrative: string;
}
export interface ElectionImpactDashboard {
  generatedAt: string; headline: string; score: number;
  turnoverRisk: number; signals: string[]; narrative: string;
}
export interface ExecutivePoliticalBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: PoliticalOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: PoliticalLens; narrative: string;
}
export interface BoardPoliticalReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: PoliticalOutlook; legislativeScore: number;
  regulatoryScore: number; fundingOpportunity: number; recommendations: string[];
  lenses: PoliticalLens; narrative: string;
}
export interface PoliticalHealthScore {
  overallScore: number; status: PoliticalHealthStatus; outlook: PoliticalOutlook;
  areaScores: Record<PoliticalArea, number>; legislativeScore: number;
  regulatoryScore: number; fundingScore: number; geopoliticalScore: number;
  forecastScore: number; scenarioScore: number; lenses: PoliticalLens; narrative: string;
}
export interface PoliticalReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: PoliticalConfidenceScore; narrative: string;
}
export interface PoliticalProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<PoliticalArea, number>; outlook: PoliticalOutlook;
  forecast: number; dashboard: PoliticalDashboard; brief: ExecutivePoliticalBrief;
  overallConfidence: PoliticalConfidenceScore;
}
export interface PoliticalHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: PoliticalArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: PoliticalMetadata;
}
export interface PoliticalPublisher { domain: string; capability: string; }
export interface PoliticalQueryRequest {
  question: string;
  focus?: "general" | PoliticalArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface PoliticalQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: PoliticalConfidenceScore;
}

export interface PoliticalRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  marketResult?: MarketResultLight; economicResult?: EconomicResultLight;
  competitiveResult?: CompetitiveResultLight;
  legalComplianceRiskResult?: LegalComplianceRiskResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight; fundingResult?: FundingResultLight;
  baselineOverrides?: Partial<PoliticalBaseline>; metadata?: PoliticalMetadata;
}

export interface PoliticalResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: PoliticalBaseline;
  healthScore: PoliticalScore;
  legislativeScore: PoliticalScore;
  regulatoryScore: PoliticalScore;
  governmentPolicyScore: PoliticalScore;
  electionsLeadershipScore: PoliticalScore;
  publicFundingScore: PoliticalScore;
  taxPolicyScore: PoliticalScore;
  educationPolicyScore: PoliticalScore;
  healthcarePolicyScore: PoliticalScore;
  laborEmploymentPolicyScore: PoliticalScore;
  internationalRelationsScore: PoliticalScore;
  tradeTariffsScore: PoliticalScore;
  immigrationPolicyScore: PoliticalScore;
  judicialDecisionsScore: PoliticalScore;
  governmentContractingScore: PoliticalScore;
  publicSentimentScore: PoliticalScore;
  lobbyingAdvocacyScore: PoliticalScore;
  geopoliticalRiskScore: PoliticalScore;
  forecastScore: PoliticalScore; scenarioScore: PoliticalScore; analysisScore: PoliticalScore;
  earlyWarningScore: PoliticalScore; politicalRiskScore: PoliticalScore;
  health: PoliticalHealthScore; dashboard: PoliticalDashboard;
  outlookDashboard: PoliticalOutlookDashboard; regulatoryDashboard: RegulatoryDashboard;
  legislativeDashboard: LegislativeDashboard; fundingOpportunitiesDashboard: FundingOpportunitiesDashboard;
  politicalRiskDashboard: PoliticalRiskDashboard; tradeInternationalDashboard: TradeInternationalDashboard;
  electionImpactDashboard: ElectionImpactDashboard;
  brief: ExecutivePoliticalBrief; boardReport: BoardPoliticalReport;
  recommendations: PoliticalRecommendationRecord[]; risks: PoliticalRiskRecord[];
  opportunities: PoliticalOpportunityRecord[];
  areaSuites: Record<PoliticalArea, PoliticalAreaSuite>;
  trendSuite: PoliticalTrendSuite; forecastSuite: PoliticalForecastSuite;
  scenarioSuite: PoliticalScenarioSuite; analysisSuite: PoliticalAnalysisSuite;
  legislativeTrackingSuite: LegislativeTrackingSuite;
  regulatoryImpactSuite: RegulatoryImpactSuite;
  politicalRiskSuite: PoliticalRiskSuite;
  governmentFundingSuite: GovernmentFundingSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: PoliticalKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: PoliticalReasoningResult; projection: PoliticalProjectionResult;
  historyRecord: PoliticalHistoryRecord; confidence: PoliticalConfidenceScore;
  requestMetadata: PoliticalMetadata;
}
