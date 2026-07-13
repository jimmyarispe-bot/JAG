import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const REPUTATION_INTELLIGENCE_VERSION = "0.1.0";
export const REPUTATION_CAPABILITIES = [
  "brand_reputation", "organizational_trust", "public_perception", "customer_reputation",
  "employee_reputation", "executive_reputation", "media_intelligence", "press_coverage",
  "social_narrative", "community_reputation", "partner_reputation", "investor_donor_confidence",
  "regulatory_reputation", "crisis_reputation", "misinformation_detection", "reputation_recovery",
  "credibility",
  "reputation_analysis", "trust_analysis", "sentiment_analysis", "narrative_analysis", "media_analysis",
  "crisis_detection", "reputation_trends", "reputation_forecasts", "scenario_planning", "early_warning",
  "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
] as const;
export const REPUTATION_AREAS = [
  "brand_reputation", "organizational_trust", "public_perception", "customer_reputation",
  "employee_reputation", "executive_reputation", "media_intelligence", "press_coverage",
  "social_narrative", "community_reputation", "partner_reputation", "investor_donor_confidence",
  "regulatory_reputation", "crisis_reputation", "misinformation_detection", "reputation_recovery",
  "credibility",
] as const;
export const REPUTATION_SCENARIOS = [
  "trust_collapse", "brand_crisis", "media_firestorm", "misinformation_surge",
  "executive_scandal", "regulatory_censure", "community_backlash", "partner_disavowal",
  "donor_confidence_shock", "narrative_reversal",
] as const;
export const REPUTATION_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "trust_assessment", "brand_strength",
  "media_exposure", "narrative_momentum", "sentiment", "crisis_risk", "credibility",
  "reputation_recovery", "early_warning",
] as const;
export const REPUTATION_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const REPUTATION_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const REPUTATION_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const REPUTATION_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const REPUTATION_OUTLOOKS = ["ascending", "stable", "fragile", "volatile", "uncertain"] as const;

export type ReputationCapability = typeof REPUTATION_CAPABILITIES[number];
export type ReputationArea = typeof REPUTATION_AREAS[number];
export type ReputationScenarioKind = typeof REPUTATION_SCENARIOS[number];
export type ReputationAnalysisKind = typeof REPUTATION_ANALYSIS_KINDS[number];
export type ReputationHealthStatus = typeof REPUTATION_HEALTH_STATUSES[number];
export type ReputationPriorityBand = typeof REPUTATION_PRIORITY_BANDS[number];
export type ReputationArtifactStatus = typeof REPUTATION_ARTIFACT_STATUSES[number];
export type ReputationConfidenceLevel = typeof REPUTATION_CONFIDENCE_LEVELS[number];
export type ReputationOutlook = typeof REPUTATION_OUTLOOKS[number];
export type ReputationMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every reputation recommendation answers these eight leadership questions. */
export interface ReputationLens {
  trustLevel: string;
  publicPerception: string;
  brandStrength: string;
  mediaExposure: string;
  crisisRisk: string;
  narrativeMomentum: string;
  credibility: string;
  longTermReputationOutlook: string;
}

export interface ReputationScore { key: string; label: string; value: number; status: ReputationHealthStatus; band: ReputationPriorityBand; narrative: string; }
export interface ReputationConfidenceScore { value: number; level: ReputationConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface StakeholderResultLight extends ResultLightBase {
  stakeholderScore?: { value?: number };
  trustLevel?: number;
  engagementQuality?: number;
  relationshipStrength?: number;
}
export interface CustomerResultLight extends ResultLightBase {
  customerScore?: { value?: number };
  brandScore?: { value?: number };
  engagementScore?: { value?: number };
}
export interface PoliticalResultLight extends ResultLightBase { politicalScore?: { value?: number }; politicalStability?: { value?: number }; }
export interface CompetitiveResultLight extends ResultLightBase { competitiveScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
/** Optional soft read when market context is attached; there is no standalone marketing domain. */
export interface MarketResultLight extends ResultLightBase { marketScore?: { value?: number }; brandPosition?: { value?: number }; }

export interface ReputationBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<ReputationArea, number>;
  trustLevel: number;
  publicPerception: number;
  brandStrength: number;
  mediaExposure: number;
  crisisRisk: number;
  narrativeMomentum: number;
  credibilityIndex: number;
  recoveryCapacity: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface ReputationAreaRecord {
  id: string; area: ReputationArea; title: string; score: number; status: ReputationArtifactStatus;
  signal: string; evidence: string[]; lenses: ReputationLens; narrative: string;
}
export interface ReputationAreaSuite {
  area: ReputationArea; records: ReputationAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface ReputationTrendRecord {
  id: string; area: ReputationArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: ReputationConfidenceLevel; lenses: ReputationLens; narrative: string;
}
export interface ReputationTrendSuite { trends: ReputationTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface ReputationForecastRecord {
  id: string; area: ReputationArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: ReputationConfidenceLevel; lenses: ReputationLens; narrative: string;
}
export interface ReputationForecastSuite {
  forecasts: ReputationForecastRecord[]; outlook: ReputationOutlook;
  maturityScore: number; narrative: string;
}

export interface ReputationScenarioRecord {
  id: string; kind: ReputationScenarioKind; title: string; probability: number;
  severity: ReputationPriorityBand; organizationalImpact: number;
  trustImpact: number; mediaImpact: number; monitors: string[];
  lenses: ReputationLens; narrative: string;
}
export interface ReputationScenarioSuite {
  scenarios: ReputationScenarioRecord[]; primaryScenario: ReputationScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface ReputationAnalysisRecord {
  id: string; kind: ReputationAnalysisKind; title: string; score: number;
  status: ReputationArtifactStatus; lenses: ReputationLens; narrative: string;
}
export interface ReputationAnalysisSuite {
  analyses: ReputationAnalysisRecord[]; kindsCovered: ReputationAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface TrustRecord {
  id: string; title: string; trust: number; lenses: ReputationLens; narrative: string;
}
export interface TrustSuite {
  records: TrustRecord[]; score: number; trustIndex: number; narrative: string;
}

export interface SentimentRecord {
  id: string; title: string; sentiment: number; lenses: ReputationLens; narrative: string;
}
export interface SentimentSuite {
  records: SentimentRecord[]; score: number; sentimentIndex: number; narrative: string;
}

export interface NarrativeAnalysisRecord {
  id: string; title: string; momentum: number; lenses: ReputationLens; narrative: string;
}
export interface NarrativeAnalysisSuite {
  records: NarrativeAnalysisRecord[]; score: number; momentumIndex: number; narrative: string;
}

export interface MediaIntelligenceRecord {
  id: string; title: string; exposure: number; lenses: ReputationLens; narrative: string;
}
export interface MediaIntelligenceSuite {
  records: MediaIntelligenceRecord[]; score: number; exposureIndex: number; narrative: string;
}

export interface CrisisDetectionRecord {
  id: string; title: string; risk: number; lenses: ReputationLens; narrative: string;
}
export interface CrisisDetectionSuite {
  records: CrisisDetectionRecord[]; score: number; crisisIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: ReputationPriorityBand; source: string;
  score: number; lenses: ReputationLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface ReputationKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: ReputationMetadata;
}
export interface ReputationKnowledgeContribution {
  artifacts: ReputationKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"stakeholder" | "customer" | "competitive" | "political" | "opportunity" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface ReputationRecommendationRecord {
  id: string; title: string; priority: ReputationPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: ReputationLens; narrative: string;
}
export interface ReputationRiskRecord {
  id: string; title: string; area: ReputationArea; severity: ReputationPriorityBand;
  score: number; mitigation: string; lenses: ReputationLens; narrative: string;
}
export interface ReputationOpportunityRecord {
  id: string; title: string; area: ReputationArea; priority: ReputationPriorityBand;
  score: number; lenses: ReputationLens; narrative: string;
}

export interface ReputationDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<ReputationArea, number>; outlook: ReputationOutlook;
  trustLevel: number; brandStrength: number; crisisRisk: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface TrustDashboard {
  generatedAt: string; headline: string; score: number;
  trustIndex: number; signals: string[]; narrative: string;
}
export interface BrandReputationDashboard {
  generatedAt: string; headline: string; score: number;
  brandStrength: number; signals: string[]; narrative: string;
}
export interface MediaIntelligenceDashboard {
  generatedAt: string; headline: string; score: number;
  exposureIndex: number; signals: string[]; narrative: string;
}
export interface NarrativeAnalysisDashboard {
  generatedAt: string; headline: string; score: number;
  momentumIndex: number; signals: string[]; narrative: string;
}
export interface CrisisMonitoringDashboard {
  generatedAt: string; headline: string; score: number;
  crisisIndex: number; signals: string[]; narrative: string;
}
export interface ReputationRecoveryDashboard {
  generatedAt: string; headline: string; score: number;
  recoveryCapacity: number; signals: string[]; narrative: string;
}
export interface ReputationForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: ReputationOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveReputationBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: ReputationOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: ReputationLens; narrative: string;
}
export interface BoardReputationReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: ReputationOutlook; trustScore: number;
  mediaScore: number; crisisScore: number; recommendations: string[];
  lenses: ReputationLens; narrative: string;
}
export interface ReputationHealthScore {
  overallScore: number; status: ReputationHealthStatus; outlook: ReputationOutlook;
  areaScores: Record<ReputationArea, number>; trustScore: number;
  brandScore: number; mediaScore: number; crisisScore: number;
  forecastScore: number; scenarioScore: number; lenses: ReputationLens; narrative: string;
}
export interface ReputationReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: ReputationConfidenceScore; narrative: string;
}
export interface ReputationProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<ReputationArea, number>; outlook: ReputationOutlook;
  forecast: number; dashboard: ReputationDashboard; brief: ExecutiveReputationBrief;
  overallConfidence: ReputationConfidenceScore;
}
export interface ReputationHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: ReputationArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: ReputationMetadata;
}
export interface ReputationPublisher { domain: string; capability: string; }
export interface ReputationQueryRequest {
  question: string;
  focus?: "general" | ReputationArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface ReputationQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: ReputationConfidenceScore;
}

export interface ReputationRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  stakeholderResult?: StakeholderResultLight; customerResult?: CustomerResultLight;
  politicalResult?: PoliticalResultLight; competitiveResult?: CompetitiveResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight; marketResult?: MarketResultLight;
  baselineOverrides?: Partial<ReputationBaseline>; metadata?: ReputationMetadata;
}

export interface ReputationResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: ReputationBaseline;
  healthScore: ReputationScore;
  brandReputationScore: ReputationScore;
  organizationalTrustScore: ReputationScore;
  publicPerceptionScore: ReputationScore;
  customerReputationScore: ReputationScore;
  employeeReputationScore: ReputationScore;
  executiveReputationScore: ReputationScore;
  mediaIntelligenceScore: ReputationScore;
  pressCoverageScore: ReputationScore;
  socialNarrativeScore: ReputationScore;
  communityReputationScore: ReputationScore;
  partnerReputationScore: ReputationScore;
  investorDonorConfidenceScore: ReputationScore;
  regulatoryReputationScore: ReputationScore;
  crisisReputationScore: ReputationScore;
  misinformationDetectionScore: ReputationScore;
  reputationRecoveryScore: ReputationScore;
  credibilityScore: ReputationScore;
  forecastScore: ReputationScore; scenarioScore: ReputationScore; analysisScore: ReputationScore;
  earlyWarningScore: ReputationScore;
  trustScore: ReputationScore; sentimentScore: ReputationScore;
  mediaScore: ReputationScore; crisisScore: ReputationScore;
  health: ReputationHealthScore; dashboard: ReputationDashboard;
  trustDashboard: TrustDashboard;
  brandReputationDashboard: BrandReputationDashboard;
  mediaIntelligenceDashboard: MediaIntelligenceDashboard;
  narrativeAnalysisDashboard: NarrativeAnalysisDashboard;
  crisisMonitoringDashboard: CrisisMonitoringDashboard;
  reputationRecoveryDashboard: ReputationRecoveryDashboard;
  forecastDashboard: ReputationForecastDashboard;
  brief: ExecutiveReputationBrief; boardReport: BoardReputationReport;
  recommendations: ReputationRecommendationRecord[]; risks: ReputationRiskRecord[];
  opportunities: ReputationOpportunityRecord[];
  areaSuites: Record<ReputationArea, ReputationAreaSuite>;
  trendSuite: ReputationTrendSuite; forecastSuite: ReputationForecastSuite;
  scenarioSuite: ReputationScenarioSuite; analysisSuite: ReputationAnalysisSuite;
  trustSuite: TrustSuite;
  sentimentSuite: SentimentSuite;
  narrativeAnalysisSuite: NarrativeAnalysisSuite;
  mediaIntelligenceSuite: MediaIntelligenceSuite;
  crisisDetectionSuite: CrisisDetectionSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: ReputationKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: ReputationReasoningResult; projection: ReputationProjectionResult;
  historyRecord: ReputationHistoryRecord; confidence: ReputationConfidenceScore;
  requestMetadata: ReputationMetadata;
}
