/**
 * Competitive Intelligence — shared types / DTOs.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const COMPETITIVE_INTELLIGENCE_VERSION = "0.1.0";
export const COMPETITIVE_CAPABILITIES = [
  "direct_peer_schools", "indirect_substitutes", "tuition_aid_positioning",
  "program_curriculum_differentiation", "enrollment_admissions_dynamics",
  "regional_market_share", "talent_faculty_competition", "brand_reputation_choice_drivers",
  "partnership_alliance_landscape", "technology_delivery_models", "expansion_launch_signals",
  "consolidation_network_strategy", "competitive_trends", "competitive_forecasts",
  "scenario_planning", "threat_mapping", "differentiation", "win_loss", "battlecards",
  "signal_monitoring", "response_playbooks", "moat_analysis", "market_share",
  "competitive_risk", "competitive_opportunity", "recommendation_generation",
  "knowledge_contribution", "closed_learning_loop",
] as const;
export const COMPETITIVE_AREAS = [
  "direct_peer_schools", "indirect_substitutes", "tuition_aid_positioning",
  "program_curriculum_differentiation", "enrollment_admissions_dynamics",
  "regional_market_share", "talent_faculty_competition", "brand_reputation_choice_drivers",
  "partnership_alliance_landscape", "technology_delivery_models", "expansion_launch_signals",
  "consolidation_network_strategy",
] as const;
export const COMPETITIVE_SCENARIOS = [
  "peer_tuition_war", "new_campus_entry", "program_launch_race", "talent_poaching",
  "substitute_disruption", "network_consolidation", "brand_reputation_shift",
  "enrollment_yield_shock", "partnership_defection", "pricing_aid_escalation",
] as const;
export const COMPETITIVE_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "threat_mapping", "differentiation",
  "win_loss", "battlecards", "signal_monitoring", "response_playbooks",
  "moat_analysis", "market_share", "competitive_risk", "competitive_opportunity",
] as const;
export const COMPETITIVE_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const COMPETITIVE_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const COMPETITIVE_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const COMPETITIVE_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const COMPETITIVE_OUTLOOKS = ["advancing", "stable", "pressured", "volatile", "uncertain"] as const;

export type CompetitiveCapability = typeof COMPETITIVE_CAPABILITIES[number];
export type CompetitiveArea = typeof COMPETITIVE_AREAS[number];
export type CompetitiveScenarioKind = typeof COMPETITIVE_SCENARIOS[number];
export type CompetitiveAnalysisKind = typeof COMPETITIVE_ANALYSIS_KINDS[number];
export type CompetitiveHealthStatus = typeof COMPETITIVE_HEALTH_STATUSES[number];
export type CompetitivePriorityBand = typeof COMPETITIVE_PRIORITY_BANDS[number];
export type CompetitiveArtifactStatus = typeof COMPETITIVE_ARTIFACT_STATUSES[number];
export type CompetitiveConfidenceLevel = typeof COMPETITIVE_CONFIDENCE_LEVELS[number];
export type CompetitiveOutlook = typeof COMPETITIVE_OUTLOOKS[number];
export type CompetitiveMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every competitive recommendation answers these eight leadership questions. */
export interface CompetitiveLens {
  competitiveThreatExists: string;
  evidenceSupports: string;
  competitorsInvolved: string;
  ourDifferentiation: string;
  enrollmentOrRevenueImpact: string;
  responseOptions: string;
  organizationalCapabilitiesRequired: string;
  signalsToMonitor: string;
}

export interface CompetitiveScore { key: string; label: string; value: number; status: CompetitiveHealthStatus; band: CompetitivePriorityBand; narrative: string; }
export interface CompetitiveConfidenceScore { value: number; level: CompetitiveConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

export interface MarketResultLight extends ResultLightBase { marketScore?: { value?: number }; competitivePositionScore?: { value?: number }; competitivePressure?: { value?: number }; competitorCount?: { value?: number }; }
export interface RevenueResultLight extends ResultLightBase { revenueScore?: { value?: number }; pricingPressure?: { value?: number }; }
export interface CustomerResultLight extends ResultLightBase { customerScore?: { value?: number }; satisfactionScore?: { value?: number }; }
export interface HumanCapitalResultLight extends ResultLightBase { humanCapitalScore?: { value?: number }; workforceScore?: { value?: number }; }
export interface BusinessModelResultLight extends ResultLightBase { businessModelScore?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface InnovationResultLight extends ResultLightBase { innovationScore?: { value?: number }; }
export interface EconomicResultLight extends ResultLightBase { economicScore?: { value?: number }; inflationPressure?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }

export interface CompetitiveBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<CompetitiveArea, number>;
  competitivePressure: number;
  differentiationStrength: number;
  marketSharePosition: number;
  brandStrength: number;
  threatLevel: number;
  opportunityIndex: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface CompetitiveAreaRecord {
  id: string; area: CompetitiveArea; title: string; score: number; status: CompetitiveArtifactStatus;
  signal: string; evidence: string[]; lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveAreaSuite {
  area: CompetitiveArea; records: CompetitiveAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface CompetitiveTrendRecord {
  id: string; area: CompetitiveArea; title: string; direction: "advancing" | "stable" | "declining";
  magnitude: number; confidence: CompetitiveConfidenceLevel; lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveTrendSuite { trends: CompetitiveTrendRecord[]; advancingCount: number; decliningCount: number; narrative: string; }

export interface CompetitiveForecastRecord {
  id: string; area: CompetitiveArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: CompetitiveConfidenceLevel; lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveForecastSuite {
  forecasts: CompetitiveForecastRecord[]; outlook: CompetitiveOutlook;
  maturityScore: number; narrative: string;
}

export interface CompetitiveScenarioRecord {
  id: string; kind: CompetitiveScenarioKind; title: string; probability: number;
  severity: CompetitivePriorityBand; enrollmentImpact: number;
  revenueImpact: number; brandImpact: number; monitors: string[];
  lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveScenarioSuite {
  scenarios: CompetitiveScenarioRecord[]; primaryScenario: CompetitiveScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface CompetitiveAnalysisRecord {
  id: string; kind: CompetitiveAnalysisKind; title: string; score: number;
  status: CompetitiveArtifactStatus; lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveAnalysisSuite {
  analyses: CompetitiveAnalysisRecord[]; kindsCovered: CompetitiveAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface CompetitiveKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: CompetitiveMetadata;
}
export interface CompetitiveKnowledgeContribution {
  artifacts: CompetitiveKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"market" | "revenue" | "customer" | "human-capital" | "opportunity" | "executive-decision" | "innovation">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface CompetitiveRecommendationRecord {
  id: string; title: string; priority: CompetitivePriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveRiskRecord {
  id: string; title: string; area: CompetitiveArea; severity: CompetitivePriorityBand;
  score: number; mitigation: string; lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveOpportunityRecord {
  id: string; title: string; area: CompetitiveArea; priority: CompetitivePriorityBand;
  score: number; lenses: CompetitiveLens; narrative: string;
}

export interface CompetitiveDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<CompetitiveArea, number>; outlook: CompetitiveOutlook;
  competitivePressure: number; differentiationStrength: number; marketSharePosition: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface CompetitiveOutlookDashboard {
  generatedAt: string; headline: string; outlook: CompetitiveOutlook;
  overall: number; primaryScenario: CompetitiveScenarioKind; narrative: string;
}
export interface ThreatDashboard {
  generatedAt: string; headline: string; score: number;
  threatLevel: number; signals: string[]; narrative: string;
}
export interface DifferentiationDashboard {
  generatedAt: string; headline: string; score: number;
  differentiationStrength: number; brandStrength: number; signals: string[]; narrative: string;
}
export interface SignalMonitoringDashboard {
  generatedAt: string; headline: string; score: number;
  signalCount: number; activeThreats: number; signals: string[]; narrative: string;
}
export interface CompetitiveForecastDashboard {
  generatedAt: string; headline: string; outlook: CompetitiveOutlook;
  maturityScore: number; forecasts: string[]; narrative: string;
}
export interface ExecutiveCompetitiveBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: CompetitiveOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: CompetitiveLens; narrative: string;
}
export interface BoardCompetitiveReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: CompetitiveOutlook; threatScore: number;
  differentiationScore: number; marketSharePosition: number; recommendations: string[];
  lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveHealthScore {
  overallScore: number; status: CompetitiveHealthStatus; outlook: CompetitiveOutlook;
  areaScores: Record<CompetitiveArea, number>; threatScore: number;
  differentiationScore: number; marketShareScore: number; brandScore: number;
  forecastScore: number; scenarioScore: number; lenses: CompetitiveLens; narrative: string;
}
export interface CompetitiveReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: CompetitiveConfidenceScore; narrative: string;
}
export interface CompetitiveProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<CompetitiveArea, number>; outlook: CompetitiveOutlook;
  forecast: number; dashboard: CompetitiveDashboard; brief: ExecutiveCompetitiveBrief;
  overallConfidence: CompetitiveConfidenceScore;
}
export interface CompetitiveHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: CompetitiveArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: CompetitiveMetadata;
}
export interface CompetitivePublisher { domain: string; capability: string; }
export interface CompetitiveQueryRequest {
  question: string;
  focus?: "general" | CompetitiveArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning";
  maxResults?: number;
}
export interface CompetitiveQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: CompetitiveConfidenceScore;
}

export interface CompetitiveRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  marketResult?: MarketResultLight; revenueResult?: RevenueResultLight;
  customerResult?: CustomerResultLight; humanCapitalResult?: HumanCapitalResultLight;
  businessModelResult?: BusinessModelResultLight; opportunityResult?: OpportunityResultLight;
  innovationResult?: InnovationResultLight; economicResult?: EconomicResultLight;
  decisionResult?: DecisionResultLight; predictiveResult?: PredictiveResultLight;
  baselineOverrides?: Partial<CompetitiveBaseline>; metadata?: CompetitiveMetadata;
}

export interface CompetitiveResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: CompetitiveBaseline;
  healthScore: CompetitiveScore;
  directPeerSchoolsScore: CompetitiveScore;
  indirectSubstitutesScore: CompetitiveScore;
  tuitionAidPositioningScore: CompetitiveScore;
  programCurriculumDifferentiationScore: CompetitiveScore;
  enrollmentAdmissionsDynamicsScore: CompetitiveScore;
  regionalMarketShareScore: CompetitiveScore;
  talentFacultyCompetitionScore: CompetitiveScore;
  brandReputationChoiceDriversScore: CompetitiveScore;
  partnershipAllianceLandscapeScore: CompetitiveScore;
  technologyDeliveryModelsScore: CompetitiveScore;
  expansionLaunchSignalsScore: CompetitiveScore;
  consolidationNetworkStrategyScore: CompetitiveScore;
  forecastScore: CompetitiveScore; scenarioScore: CompetitiveScore; analysisScore: CompetitiveScore;
  health: CompetitiveHealthScore; dashboard: CompetitiveDashboard;
  outlookDashboard: CompetitiveOutlookDashboard; threatDashboard: ThreatDashboard;
  differentiationDashboard: DifferentiationDashboard;
  signalMonitoringDashboard: SignalMonitoringDashboard;
  forecastDashboard: CompetitiveForecastDashboard;
  brief: ExecutiveCompetitiveBrief; boardReport: BoardCompetitiveReport;
  recommendations: CompetitiveRecommendationRecord[]; risks: CompetitiveRiskRecord[];
  opportunities: CompetitiveOpportunityRecord[];
  areaSuites: Record<CompetitiveArea, CompetitiveAreaSuite>;
  trendSuite: CompetitiveTrendSuite; forecastSuite: CompetitiveForecastSuite;
  scenarioSuite: CompetitiveScenarioSuite; analysisSuite: CompetitiveAnalysisSuite;
  knowledgeContribution: CompetitiveKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: CompetitiveReasoningResult; projection: CompetitiveProjectionResult;
  historyRecord: CompetitiveHistoryRecord; confidence: CompetitiveConfidenceScore;
  requestMetadata: CompetitiveMetadata;
}
