/**
 * Collective Intelligence — shared types / DTOs.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const COLLECTIVE_INTELLIGENCE_VERSION = "0.1.0";
export const COLLECTIVE_CAPABILITIES = [
  "collective_reasoning", "consensus_analysis", "distributed_expertise", "collaborative_intelligence", "multi_domain_synthesis", "cross_functional_intelligence", "organizational_alignment", "team_decision_intelligence", "expert_weighting", "perspective_diversity", "conflict_resolution", "collaborative_learning", "organizational_coordination", "shared_decision_quality", "collective_opportunity_detection", "collective_risk_assessment", "collective_intelligence_evolution", "collective_analysis", "consensus_analysis_engine", "distributed_expertise_engine", "cross_domain_synthesis", "collaboration_analysis", "conflict_resolution_engine", "collective_trends", "collective_forecasts", "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
] as const;
export const COLLECTIVE_AREAS = [
  "collective_reasoning", "consensus_analysis", "distributed_expertise", "collaborative_intelligence", "multi_domain_synthesis", "cross_functional_intelligence", "organizational_alignment", "team_decision_intelligence", "expert_weighting", "perspective_diversity", "conflict_resolution", "collaborative_learning", "organizational_coordination", "shared_decision_quality", "collective_opportunity_detection", "collective_risk_assessment", "collective_intelligence_evolution",
] as const;
export const COLLECTIVE_SCENARIOS = [
  "consensus_collapse", "expertise_silo", "perspective_polarization", "cross_domain_conflict",
  "alignment_failure", "collaboration_breakdown", "expert_weighting_distortion", "synthesis_stalemate",
  "collective_overconfidence", "distributed_blind_spot",
] as const;
export const COLLECTIVE_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "consensus_strength", "expertise_coverage",
  "perspective_diversity", "cross_domain_agreement", "organizational_alignment",
  "collaboration_quality", "collective_confidence", "long_term_collective_value", "early_warning",
] as const;
export const COLLECTIVE_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const COLLECTIVE_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const COLLECTIVE_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const COLLECTIVE_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const COLLECTIVE_OUTLOOKS = ["aligned", "stable", "contested", "volatile", "uncertain"] as const;

export type CollectiveCapability = typeof COLLECTIVE_CAPABILITIES[number];
export type CollectiveArea = typeof COLLECTIVE_AREAS[number];
export type CollectiveScenarioKind = typeof COLLECTIVE_SCENARIOS[number];
export type CollectiveAnalysisKind = typeof COLLECTIVE_ANALYSIS_KINDS[number];
export type CollectiveHealthStatus = typeof COLLECTIVE_HEALTH_STATUSES[number];
export type CollectivePriorityBand = typeof COLLECTIVE_PRIORITY_BANDS[number];
export type CollectiveArtifactStatus = typeof COLLECTIVE_ARTIFACT_STATUSES[number];
export type CollectiveConfidenceLevel = typeof COLLECTIVE_CONFIDENCE_LEVELS[number];
export type CollectiveOutlook = typeof COLLECTIVE_OUTLOOKS[number];
export type CollectiveMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every collective recommendation answers these eight leadership questions. */
export interface CollectiveLens {
  consensusStrength: string;
  expertiseCoverage: string;
  perspectiveDiversity: string;
  crossDomainAgreement: string;
  organizationalAlignment: string;
  collaborationQuality: string;
  collectiveConfidence: string;
  longTermCollectiveValue: string;
}

export interface CollectiveScore { key: string; label: string; value: number; status: CollectiveHealthStatus; band: CollectivePriorityBand; narrative: string; }
export interface CollectiveConfidenceScore { value: number; level: CollectiveConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

/** Soft-read of Sprint 058 Institutional Memory Intelligence. */
export interface InstitutionalMemoryResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  institutionalMemoryScore?: { value?: number };
  baseline?: { knowledgeConfidence?: number; institutionalMemoryCoverage?: number; knowledgeQuality?: number };
}
export interface KnowledgeResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  knowledgeScore?: { value?: number };
  baseline?: { knowledgeConfidence?: number; knowledgeFreshness?: number; knowledgeQuality?: number };
}
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  behavioralScore?: { value?: number };
}
export interface CulturalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  culturalScore?: { value?: number };
}
export interface StakeholderResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  engagementScore?: { value?: number };
}
export interface SystemsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptability?: number;
  cascadingRisk?: number;
}
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface EcosystemResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ecosystemScore?: { value?: number };
}
export interface ResilienceResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptiveCapacity?: number;
}
export interface EthicalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ethicalScore?: { value?: number };
}
export interface MarketResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  marketScore?: { value?: number };
}
export interface CompetitiveResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  competitiveScore?: { value?: number };
}
export interface HumanCapitalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  humanCapitalScore?: { value?: number };
}
export interface OperationsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  operationsScore?: { value?: number };
}

export interface CollectiveBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<CollectiveArea, number>;
  consensusStrength: number;
  expertiseCoverage: number;
  perspectiveDiversity: number;
  crossDomainAgreement: number;
  organizationalAlignment: number;
  collaborationQuality: number;
  collectiveConfidence: number;
  longTermCollectiveValue: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface CollectiveAreaRecord {
  id: string; area: CollectiveArea; title: string; score: number; status: CollectiveArtifactStatus;
  signal: string; evidence: string[]; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveAreaSuite {
  area: CollectiveArea; records: CollectiveAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface CollectiveTrendRecord {
  id: string; area: CollectiveArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: CollectiveConfidenceLevel; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveTrendSuite { trends: CollectiveTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface CollectiveForecastRecord {
  id: string; area: CollectiveArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: CollectiveConfidenceLevel; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveForecastSuite {
  forecasts: CollectiveForecastRecord[]; outlook: CollectiveOutlook;
  maturityScore: number; narrative: string;
}

export interface CollectiveScenarioRecord {
  id: string; kind: CollectiveScenarioKind; title: string; probability: number;
  severity: CollectivePriorityBand; organizationalImpact: number;
  consensusImpact: number; expertiseImpact: number; monitors: string[];
  lenses: CollectiveLens; narrative: string;
}
export interface CollectiveScenarioSuite {
  scenarios: CollectiveScenarioRecord[]; primaryScenario: CollectiveScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface CollectiveAnalysisRecord {
  id: string; kind: CollectiveAnalysisKind; title: string; score: number;
  status: CollectiveArtifactStatus; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveAnalysisSuite {
  analyses: CollectiveAnalysisRecord[]; kindsCovered: CollectiveAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface ConsensusRecord {
  id: string; title: string; strength: number; lenses: CollectiveLens; narrative: string;
}
export interface ConsensusSuite {
  records: ConsensusRecord[]; score: number; consensusIndex: number; narrative: string;
}

export interface DistributedExpertiseRecord {
  id: string; title: string; coverage: number; lenses: CollectiveLens; narrative: string;
}
export interface DistributedExpertiseSuite {
  records: DistributedExpertiseRecord[]; score: number; expertiseIndex: number; narrative: string;
}

export interface CrossDomainSynthesisRecord {
  id: string; title: string; synthesisIndex: number; lenses: CollectiveLens; narrative: string;
}
export interface CrossDomainSynthesisSuite {
  records: CrossDomainSynthesisRecord[]; score: number; synthesisIndex: number; narrative: string;
}

export interface CollaborationRecord {
  id: string; title: string; collaborationIndex: number; lenses: CollectiveLens; narrative: string;
}
export interface CollaborationSuite {
  records: CollaborationRecord[]; score: number; collaborationIndex: number; narrative: string;
}

export interface ConflictResolutionRecord {
  id: string; title: string; resolutionIndex: number; lenses: CollectiveLens; narrative: string;
}
export interface ConflictResolutionSuite {
  records: ConflictResolutionRecord[]; score: number; resolutionIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: CollectivePriorityBand; source: string;
  score: number; lenses: CollectiveLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface CollectiveKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: CollectiveMetadata;
}
export interface CollectiveKnowledgeContribution {
  artifacts: CollectiveKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"institutional-memory" | "knowledge" | "executive-decision" | "opportunity" | "predictive" | "stakeholder" | "organizational-improvement">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface CollectiveRecommendationRecord {
  id: string; title: string; priority: CollectivePriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveRiskRecord {
  id: string; title: string; area: CollectiveArea; severity: CollectivePriorityBand;
  score: number; mitigation: string; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveOpportunityRecord {
  id: string; title: string; area: CollectiveArea; priority: CollectivePriorityBand;
  score: number; lenses: CollectiveLens; narrative: string;
}

export interface CollectiveDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<CollectiveArea, number>; outlook: CollectiveOutlook;
  consensusStrength: number; collaborationQuality: number; collectiveConfidence: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface ConsensusDashboard {
  generatedAt: string; headline: string; score: number;
  consensusIndex: number; signals: string[]; narrative: string;
}
export interface CrossDomainIntelligenceDashboard {
  generatedAt: string; headline: string; score: number;
  synthesisIndex: number; signals: string[]; narrative: string;
}
export interface ExpertiseNetworkDashboard {
  generatedAt: string; headline: string; score: number;
  expertiseIndex: number; signals: string[]; narrative: string;
}
export interface OrganizationalAlignmentDashboard {
  generatedAt: string; headline: string; score: number;
  alignmentIndex: number; signals: string[]; narrative: string;
}
export interface CollaborationHealthDashboard {
  generatedAt: string; headline: string; score: number;
  collaborationIndex: number; signals: string[]; narrative: string;
}
export interface CollectiveLearningDashboard {
  generatedAt: string; headline: string; score: number;
  learningIndex: number; signals: string[]; narrative: string;
}
export interface CollectiveForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: CollectiveOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveCollectiveBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: CollectiveOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: CollectiveLens; narrative: string;
}
export interface BoardCollectiveReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: CollectiveOutlook; consensusEngineScore: number;
  collaborationEngineScore: number; crossDomainSynthesisScore: number; recommendations: string[];
  lenses: CollectiveLens; narrative: string;
}
export interface CollectiveHealthScore {
  overallScore: number; status: CollectiveHealthStatus; outlook: CollectiveOutlook;
  areaScores: Record<CollectiveArea, number>; consensusEngineScore: number;
  collaborationEngineScore: number; crossDomainSynthesisScore: number;
  forecastScore: number; scenarioScore: number; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: CollectiveConfidenceScore; narrative: string;
}
export interface CollectiveProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<CollectiveArea, number>; outlook: CollectiveOutlook;
  forecast: number; dashboard: CollectiveDashboard; brief: ExecutiveCollectiveBrief;
  overallConfidence: CollectiveConfidenceScore;
}
export interface CollectiveHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: CollectiveArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: CollectiveMetadata;
}
export interface CollectivePublisher { domain: string; capability: string; }
export interface CollectiveQueryRequest {
  question: string;
  focus?: "general" | CollectiveArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface CollectiveQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: CollectiveConfidenceScore;
}

export interface CollectiveRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  institutionalMemoryResult?: InstitutionalMemoryResultLight;
  knowledgeResult?: KnowledgeResultLight;
  decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight;
  behavioralResult?: BehavioralResultLight;
  culturalResult?: CulturalResultLight;
  stakeholderResult?: StakeholderResultLight;
  systemsResult?: SystemsResultLight;
  opportunityResult?: OpportunityResultLight;
  ecosystemResult?: EcosystemResultLight;
  resilienceResult?: ResilienceResultLight;
  ethicalResult?: EthicalResultLight;
  marketResult?: MarketResultLight;
  competitiveResult?: CompetitiveResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  operationsResult?: OperationsResultLight;
  baselineOverrides?: Partial<CollectiveBaseline>; metadata?: CollectiveMetadata;
}

export interface CollectiveResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: CollectiveBaseline;
  healthScore: CollectiveScore;
  collectiveReasoningScore: CollectiveScore;
  consensusAnalysisScore: CollectiveScore;
  distributedExpertiseScore: CollectiveScore;
  collaborativeIntelligenceScore: CollectiveScore;
  multiDomainSynthesisScore: CollectiveScore;
  crossFunctionalIntelligenceScore: CollectiveScore;
  organizationalAlignmentScore: CollectiveScore;
  teamDecisionIntelligenceScore: CollectiveScore;
  expertWeightingScore: CollectiveScore;
  perspectiveDiversityScore: CollectiveScore;
  conflictResolutionScore: CollectiveScore;
  collaborativeLearningScore: CollectiveScore;
  organizationalCoordinationScore: CollectiveScore;
  sharedDecisionQualityScore: CollectiveScore;
  collectiveOpportunityDetectionScore: CollectiveScore;
  collectiveRiskAssessmentScore: CollectiveScore;
  collectiveIntelligenceEvolutionScore: CollectiveScore;
  forecastScore: CollectiveScore; scenarioScore: CollectiveScore; analysisScore: CollectiveScore;
  earlyWarningScore: CollectiveScore;
  consensusEngineScore: CollectiveScore; distributedExpertiseEngineScore: CollectiveScore;
  crossDomainSynthesisScore: CollectiveScore; collaborationEngineScore: CollectiveScore;
  conflictResolutionEngineScore: CollectiveScore;
  health: CollectiveHealthScore; dashboard: CollectiveDashboard;
  consensusDashboard: ConsensusDashboard;
  crossDomainIntelligenceDashboard: CrossDomainIntelligenceDashboard;
  expertiseNetworkDashboard: ExpertiseNetworkDashboard;
  organizationalAlignmentDashboard: OrganizationalAlignmentDashboard;
  collaborationHealthDashboard: CollaborationHealthDashboard;
  collectiveLearningDashboard: CollectiveLearningDashboard;
  forecastDashboard: CollectiveForecastDashboard;
  brief: ExecutiveCollectiveBrief; boardReport: BoardCollectiveReport;
  recommendations: CollectiveRecommendationRecord[]; risks: CollectiveRiskRecord[];
  opportunities: CollectiveOpportunityRecord[];
  areaSuites: Record<CollectiveArea, CollectiveAreaSuite>;
  trendSuite: CollectiveTrendSuite; forecastSuite: CollectiveForecastSuite;
  scenarioSuite: CollectiveScenarioSuite; analysisSuite: CollectiveAnalysisSuite;
  consensusSuite: ConsensusSuite;
  distributedExpertiseSuite: DistributedExpertiseSuite;
  crossDomainSynthesisSuite: CrossDomainSynthesisSuite;
  collaborationSuite: CollaborationSuite;
  conflictResolutionSuite: ConflictResolutionSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: CollectiveKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: CollectiveReasoningResult; projection: CollectiveProjectionResult;
  historyRecord: CollectiveHistoryRecord; confidence: CollectiveConfidenceScore;
  requestMetadata: CollectiveMetadata;
}
