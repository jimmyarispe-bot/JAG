/**
 * Stakeholder Intelligence — shared types / DTOs.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const STAKEHOLDER_INTELLIGENCE_VERSION = "0.1.0";
export const STAKEHOLDER_CAPABILITIES = [
  "stakeholder_identification", "stakeholder_mapping", "influence_analysis", "interest_analysis",
  "engagement", "communication", "trust_relationship", "board_stakeholders", "investor_donor",
  "customer_stakeholders", "employee_stakeholders", "partner_stakeholders", "community_stakeholders",
  "government_stakeholders", "satisfaction_sentiment", "conflict_detection", "collaboration_opportunities",
  "stakeholder_mapping_engine", "influence_analysis_engine", "relationship_analysis", "sentiment_analysis",
  "engagement_analysis", "conflict_detection_engine", "stakeholder_trends", "stakeholder_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation",
  "knowledge_contribution", "closed_learning_loop",
] as const;
export const STAKEHOLDER_AREAS = [
  "stakeholder_identification", "stakeholder_mapping", "influence_analysis", "interest_analysis",
  "engagement", "communication", "trust_relationship", "board_stakeholders", "investor_donor",
  "customer_stakeholders", "employee_stakeholders", "partner_stakeholders", "community_stakeholders",
  "government_stakeholders", "satisfaction_sentiment", "conflict_detection", "collaboration_opportunities",
] as const;
export const STAKEHOLDER_SCENARIOS = [
  "trust_erosion", "engagement_collapse", "influence_shift", "interest_conflict",
  "board_turnover", "donor_withdrawal", "employee_sentiment_shock", "partner_defection",
  "community_opposition", "government_pressure",
] as const;
export const STAKEHOLDER_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "influence_mapping", "interest_alignment",
  "relationship_strength", "engagement_quality", "sentiment", "conflict_risk",
  "collaboration_opportunity", "strategic_importance", "early_warning",
] as const;
export const STAKEHOLDER_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const STAKEHOLDER_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const STAKEHOLDER_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const STAKEHOLDER_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const STAKEHOLDER_OUTLOOKS = ["aligned", "stable", "strained", "volatile", "uncertain"] as const;

export type StakeholderCapability = typeof STAKEHOLDER_CAPABILITIES[number];
export type StakeholderArea = typeof STAKEHOLDER_AREAS[number];
export type StakeholderScenarioKind = typeof STAKEHOLDER_SCENARIOS[number];
export type StakeholderAnalysisKind = typeof STAKEHOLDER_ANALYSIS_KINDS[number];
export type StakeholderHealthStatus = typeof STAKEHOLDER_HEALTH_STATUSES[number];
export type StakeholderPriorityBand = typeof STAKEHOLDER_PRIORITY_BANDS[number];
export type StakeholderArtifactStatus = typeof STAKEHOLDER_ARTIFACT_STATUSES[number];
export type StakeholderConfidenceLevel = typeof STAKEHOLDER_CONFIDENCE_LEVELS[number];
export type StakeholderOutlook = typeof STAKEHOLDER_OUTLOOKS[number];
export type StakeholderMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every stakeholder recommendation answers these eight leadership questions. */
export interface StakeholderLens {
  influence: string;
  interest: string;
  trust: string;
  engagement: string;
  satisfaction: string;
  relationshipStrength: string;
  collaborationOpportunity: string;
  strategicImportance: string;
}

export interface StakeholderScore { key: string; label: string; value: number; status: StakeholderHealthStatus; band: StakeholderPriorityBand; narrative: string; }
export interface StakeholderConfidenceScore { value: number; level: StakeholderConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

export interface CustomerResultLight extends ResultLightBase { customerScore?: { value?: number }; }
export interface HumanCapitalResultLight extends ResultLightBase { humanCapitalScore?: { value?: number }; }
export interface PoliticalResultLight extends ResultLightBase { politicalScore?: { value?: number }; politicalStability?: { value?: number }; }
export interface CompetitiveResultLight extends ResultLightBase { competitiveScore?: { value?: number }; }
export interface EnvironmentalResultLight extends ResultLightBase { environmentalScore?: { value?: number }; sustainabilityScore?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }

export interface StakeholderBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<StakeholderArea, number>;
  influencePressure: number;
  interestAlignment: number;
  trustLevel: number;
  engagementQuality: number;
  satisfactionIndex: number;
  relationshipStrength: number;
  collaborationPotential: number;
  strategicImportance: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface StakeholderAreaRecord {
  id: string; area: StakeholderArea; title: string; score: number; status: StakeholderArtifactStatus;
  signal: string; evidence: string[]; lenses: StakeholderLens; narrative: string;
}
export interface StakeholderAreaSuite {
  area: StakeholderArea; records: StakeholderAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface StakeholderTrendRecord {
  id: string; area: StakeholderArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: StakeholderConfidenceLevel; lenses: StakeholderLens; narrative: string;
}
export interface StakeholderTrendSuite { trends: StakeholderTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface StakeholderForecastRecord {
  id: string; area: StakeholderArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: StakeholderConfidenceLevel; lenses: StakeholderLens; narrative: string;
}
export interface StakeholderForecastSuite {
  forecasts: StakeholderForecastRecord[]; outlook: StakeholderOutlook;
  maturityScore: number; narrative: string;
}

export interface StakeholderScenarioRecord {
  id: string; kind: StakeholderScenarioKind; title: string; probability: number;
  severity: StakeholderPriorityBand; organizationalImpact: number;
  relationshipImpact: number; engagementImpact: number; monitors: string[];
  lenses: StakeholderLens; narrative: string;
}
export interface StakeholderScenarioSuite {
  scenarios: StakeholderScenarioRecord[]; primaryScenario: StakeholderScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface StakeholderAnalysisRecord {
  id: string; kind: StakeholderAnalysisKind; title: string; score: number;
  status: StakeholderArtifactStatus; lenses: StakeholderLens; narrative: string;
}
export interface StakeholderAnalysisSuite {
  analyses: StakeholderAnalysisRecord[]; kindsCovered: StakeholderAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface StakeholderMappingRecord {
  id: string; title: string; area: StakeholderArea; coverage: number;
  lenses: StakeholderLens; narrative: string;
}
export interface StakeholderMappingSuite {
  records: StakeholderMappingRecord[]; score: number; coverageIndex: number; narrative: string;
}

export interface InfluenceRecord {
  id: string; title: string; area: StakeholderArea; influence: number;
  lenses: StakeholderLens; narrative: string;
}
export interface InfluenceSuite {
  records: InfluenceRecord[]; score: number; influenceIndex: number; narrative: string;
}

export interface RelationshipRecord {
  id: string; title: string; strength: number; lenses: StakeholderLens; narrative: string;
}
export interface RelationshipSuite {
  records: RelationshipRecord[]; score: number; strengthIndex: number; narrative: string;
}

export interface SentimentRecord {
  id: string; title: string; sentiment: number; lenses: StakeholderLens; narrative: string;
}
export interface SentimentSuite {
  records: SentimentRecord[]; score: number; sentimentIndex: number; narrative: string;
}

export interface EngagementRecord {
  id: string; title: string; quality: number; lenses: StakeholderLens; narrative: string;
}
export interface EngagementSuite {
  records: EngagementRecord[]; score: number; qualityIndex: number; narrative: string;
}

export interface ConflictDetectionRecord {
  id: string; title: string; risk: number; lenses: StakeholderLens; narrative: string;
}
export interface ConflictDetectionSuite {
  records: ConflictDetectionRecord[]; score: number; conflictIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: StakeholderPriorityBand; source: string;
  score: number; lenses: StakeholderLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface StakeholderKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: StakeholderMetadata;
}
export interface StakeholderKnowledgeContribution {
  artifacts: StakeholderKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"customer" | "human-capital" | "political" | "competitive" | "opportunity" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface StakeholderRecommendationRecord {
  id: string; title: string; priority: StakeholderPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: StakeholderLens; narrative: string;
}
export interface StakeholderRiskRecord {
  id: string; title: string; area: StakeholderArea; severity: StakeholderPriorityBand;
  score: number; mitigation: string; lenses: StakeholderLens; narrative: string;
}
export interface StakeholderOpportunityRecord {
  id: string; title: string; area: StakeholderArea; priority: StakeholderPriorityBand;
  score: number; lenses: StakeholderLens; narrative: string;
}

export interface StakeholderDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<StakeholderArea, number>; outlook: StakeholderOutlook;
  influencePressure: number; trustLevel: number; engagementQuality: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface InfluenceMapDashboard {
  generatedAt: string; headline: string; score: number;
  influenceIndex: number; signals: string[]; narrative: string;
}
export interface RelationshipsDashboard {
  generatedAt: string; headline: string; score: number;
  strengthIndex: number; signals: string[]; narrative: string;
}
export interface EngagementDashboard {
  generatedAt: string; headline: string; score: number;
  qualityIndex: number; signals: string[]; narrative: string;
}
export interface SentimentDashboard {
  generatedAt: string; headline: string; score: number;
  sentimentIndex: number; signals: string[]; narrative: string;
}
export interface TrustDashboard {
  generatedAt: string; headline: string; score: number;
  trustLevel: number; signals: string[]; narrative: string;
}
export interface CollaborationOpportunitiesDashboard {
  generatedAt: string; headline: string; score: number;
  collaborationPotential: number; signals: string[]; narrative: string;
}
export interface StakeholderForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: StakeholderOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveStakeholderBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: StakeholderOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: StakeholderLens; narrative: string;
}
export interface BoardStakeholderReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: StakeholderOutlook; influenceScore: number;
  trustScore: number; engagementScore: number; recommendations: string[];
  lenses: StakeholderLens; narrative: string;
}
export interface StakeholderHealthScore {
  overallScore: number; status: StakeholderHealthStatus; outlook: StakeholderOutlook;
  areaScores: Record<StakeholderArea, number>; influenceScore: number;
  trustScore: number; engagementScore: number; relationshipScore: number;
  forecastScore: number; scenarioScore: number; lenses: StakeholderLens; narrative: string;
}
export interface StakeholderReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: StakeholderConfidenceScore; narrative: string;
}
export interface StakeholderProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<StakeholderArea, number>; outlook: StakeholderOutlook;
  forecast: number; dashboard: StakeholderDashboard; brief: ExecutiveStakeholderBrief;
  overallConfidence: StakeholderConfidenceScore;
}
export interface StakeholderHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: StakeholderArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: StakeholderMetadata;
}
export interface StakeholderPublisher { domain: string; capability: string; }
export interface StakeholderQueryRequest {
  question: string;
  focus?: "general" | StakeholderArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface StakeholderQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: StakeholderConfidenceScore;
}

export interface StakeholderRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  customerResult?: CustomerResultLight; humanCapitalResult?: HumanCapitalResultLight;
  politicalResult?: PoliticalResultLight; competitiveResult?: CompetitiveResultLight;
  environmentalResult?: EnvironmentalResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight;
  baselineOverrides?: Partial<StakeholderBaseline>; metadata?: StakeholderMetadata;
}

export interface StakeholderResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: StakeholderBaseline;
  healthScore: StakeholderScore;
  stakeholderIdentificationScore: StakeholderScore;
  stakeholderMappingScore: StakeholderScore;
  influenceAnalysisScore: StakeholderScore;
  interestAnalysisScore: StakeholderScore;
  engagementScore: StakeholderScore;
  communicationScore: StakeholderScore;
  trustRelationshipScore: StakeholderScore;
  boardStakeholdersScore: StakeholderScore;
  investorDonorScore: StakeholderScore;
  customerStakeholdersScore: StakeholderScore;
  employeeStakeholdersScore: StakeholderScore;
  partnerStakeholdersScore: StakeholderScore;
  communityStakeholdersScore: StakeholderScore;
  governmentStakeholdersScore: StakeholderScore;
  satisfactionSentimentScore: StakeholderScore;
  conflictDetectionScore: StakeholderScore;
  collaborationOpportunitiesScore: StakeholderScore;
  forecastScore: StakeholderScore; scenarioScore: StakeholderScore; analysisScore: StakeholderScore;
  earlyWarningScore: StakeholderScore;
  influenceScore: StakeholderScore; relationshipScore: StakeholderScore;
  sentimentScore: StakeholderScore;
  health: StakeholderHealthScore; dashboard: StakeholderDashboard;
  influenceMapDashboard: InfluenceMapDashboard;
  relationshipsDashboard: RelationshipsDashboard;
  engagementDashboard: EngagementDashboard;
  sentimentDashboard: SentimentDashboard;
  trustDashboard: TrustDashboard;
  collaborationOpportunitiesDashboard: CollaborationOpportunitiesDashboard;
  forecastDashboard: StakeholderForecastDashboard;
  brief: ExecutiveStakeholderBrief; boardReport: BoardStakeholderReport;
  recommendations: StakeholderRecommendationRecord[]; risks: StakeholderRiskRecord[];
  opportunities: StakeholderOpportunityRecord[];
  areaSuites: Record<StakeholderArea, StakeholderAreaSuite>;
  trendSuite: StakeholderTrendSuite; forecastSuite: StakeholderForecastSuite;
  scenarioSuite: StakeholderScenarioSuite; analysisSuite: StakeholderAnalysisSuite;
  stakeholderMappingSuite: StakeholderMappingSuite;
  influenceSuite: InfluenceSuite;
  relationshipSuite: RelationshipSuite;
  sentimentSuite: SentimentSuite;
  engagementSuite: EngagementSuite;
  conflictDetectionSuite: ConflictDetectionSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: StakeholderKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: StakeholderReasoningResult; projection: StakeholderProjectionResult;
  historyRecord: StakeholderHistoryRecord; confidence: StakeholderConfidenceScore;
  requestMetadata: StakeholderMetadata;
}
