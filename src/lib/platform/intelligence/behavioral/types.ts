import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const BEHAVIORAL_INTELLIGENCE_VERSION = "0.1.0";
export const BEHAVIORAL_CAPABILITIES = [
  "decision_behavior", "cognitive_bias", "motivation", "incentive_modeling", "organizational_change",
  "change_resistance", "leadership_behavior", "team_dynamics", "collaboration", "communication_patterns",
  "conflict_behavior", "customer_behavior", "employee_behavior", "learning_adaptation", "adoption_forecasting",
  "behavioral_risk", "behavioral_opportunity",
  "behavioral_analysis", "decision_modeling", "cognitive_bias_analysis", "motivation_analysis",
  "collaboration_analysis", "change_adoption", "behavioral_trends", "behavioral_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution",
  "closed_learning_loop",
] as const;
export const BEHAVIORAL_AREAS = [
  "decision_behavior", "cognitive_bias", "motivation", "incentive_modeling", "organizational_change",
  "change_resistance", "leadership_behavior", "team_dynamics", "collaboration", "communication_patterns",
  "conflict_behavior", "customer_behavior", "employee_behavior", "learning_adaptation", "adoption_forecasting",
  "behavioral_risk", "behavioral_opportunity",
] as const;
export const BEHAVIORAL_SCENARIOS = [
  "decision_paralysis", "bias_cascade", "motivation_collapse", "change_resistance_surge",
  "leadership_misalignment", "team_fragmentation", "collaboration_breakdown", "adoption_stall",
  "behavioral_risk_spike", "incentive_distortion",
] as const;
export const BEHAVIORAL_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "decision_modeling", "cognitive_bias", "motivation_alignment",
  "adoption_probability", "collaboration_impact", "change_resistance", "leadership_readiness",
  "behavioral_risk", "early_warning",
] as const;
export const BEHAVIORAL_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const BEHAVIORAL_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const BEHAVIORAL_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const BEHAVIORAL_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const BEHAVIORAL_OUTLOOKS = ["adaptive", "stable", "resistant", "volatile", "uncertain"] as const;

export type BehavioralCapability = typeof BEHAVIORAL_CAPABILITIES[number];
export type BehavioralArea = typeof BEHAVIORAL_AREAS[number];
export type BehavioralScenarioKind = typeof BEHAVIORAL_SCENARIOS[number];
export type BehavioralAnalysisKind = typeof BEHAVIORAL_ANALYSIS_KINDS[number];
export type BehavioralHealthStatus = typeof BEHAVIORAL_HEALTH_STATUSES[number];
export type BehavioralPriorityBand = typeof BEHAVIORAL_PRIORITY_BANDS[number];
export type BehavioralArtifactStatus = typeof BEHAVIORAL_ARTIFACT_STATUSES[number];
export type BehavioralConfidenceLevel = typeof BEHAVIORAL_CONFIDENCE_LEVELS[number];
export type BehavioralOutlook = typeof BEHAVIORAL_OUTLOOKS[number];
export type BehavioralMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every behavioral recommendation answers these eight leadership questions. */
export interface BehavioralLens {
  decisionConfidence: string;
  cognitiveBiasRisk: string;
  motivationAlignment: string;
  adoptionProbability: string;
  collaborationImpact: string;
  changeResistance: string;
  leadershipReadiness: string;
  longTermBehavioralOutlook: string;
}

export interface BehavioralScore { key: string; label: string; value: number; status: BehavioralHealthStatus; band: BehavioralPriorityBand; narrative: string; }
export interface BehavioralConfidenceScore { value: number; level: BehavioralConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface StakeholderResultLight extends ResultLightBase {
  stakeholderScore?: { value?: number };
  trustLevel?: number;
  engagementQuality?: number;
  relationshipStrength?: number;
}
export interface ReputationResultLight extends ResultLightBase {
  reputationScore?: { value?: number };
  trustLevel?: number;
  brandStrength?: number;
  crisisRisk?: number;
}
export interface HumanCapitalResultLight extends ResultLightBase {
  humanCapitalScore?: { value?: number };
  engagementScore?: { value?: number };
  leadershipScore?: { value?: number };
}
export interface CustomerResultLight extends ResultLightBase {
  customerScore?: { value?: number };
  engagementScore?: { value?: number };
  behaviorScore?: { value?: number };
}
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
/** Soft-read when knowledge context is attached (future-ready soft optional light). */
export interface KnowledgeResultLight extends ResultLightBase {
  knowledgeScore?: { value?: number };
  coverageScore?: { value?: number };
}

export interface BehavioralBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<BehavioralArea, number>;
  decisionConfidence: number;
  cognitiveBiasRisk: number;
  motivationAlignment: number;
  adoptionProbability: number;
  collaborationImpact: number;
  changeResistance: number;
  leadershipReadiness: number;
  teamCohesion: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface BehavioralAreaRecord {
  id: string; area: BehavioralArea; title: string; score: number; status: BehavioralArtifactStatus;
  signal: string; evidence: string[]; lenses: BehavioralLens; narrative: string;
}
export interface BehavioralAreaSuite {
  area: BehavioralArea; records: BehavioralAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface BehavioralTrendRecord {
  id: string; area: BehavioralArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: BehavioralConfidenceLevel; lenses: BehavioralLens; narrative: string;
}
export interface BehavioralTrendSuite { trends: BehavioralTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface BehavioralForecastRecord {
  id: string; area: BehavioralArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: BehavioralConfidenceLevel; lenses: BehavioralLens; narrative: string;
}
export interface BehavioralForecastSuite {
  forecasts: BehavioralForecastRecord[]; outlook: BehavioralOutlook;
  maturityScore: number; narrative: string;
}

export interface BehavioralScenarioRecord {
  id: string; kind: BehavioralScenarioKind; title: string; probability: number;
  severity: BehavioralPriorityBand; organizationalImpact: number;
  decisionImpact: number; adoptionImpact: number; monitors: string[];
  lenses: BehavioralLens; narrative: string;
}
export interface BehavioralScenarioSuite {
  scenarios: BehavioralScenarioRecord[]; primaryScenario: BehavioralScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface BehavioralAnalysisRecord {
  id: string; kind: BehavioralAnalysisKind; title: string; score: number;
  status: BehavioralArtifactStatus; lenses: BehavioralLens; narrative: string;
}
export interface BehavioralAnalysisSuite {
  analyses: BehavioralAnalysisRecord[]; kindsCovered: BehavioralAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface DecisionModelingRecord {
  id: string; title: string; confidence: number; lenses: BehavioralLens; narrative: string;
}
export interface DecisionModelingSuite {
  records: DecisionModelingRecord[]; score: number; decisionIndex: number; narrative: string;
}

export interface CognitiveBiasRecord {
  id: string; title: string; biasRisk: number; lenses: BehavioralLens; narrative: string;
}
export interface CognitiveBiasSuite {
  records: CognitiveBiasRecord[]; score: number; biasIndex: number; narrative: string;
}

export interface MotivationRecord {
  id: string; title: string; motivation: number; lenses: BehavioralLens; narrative: string;
}
export interface MotivationSuite {
  records: MotivationRecord[]; score: number; motivationIndex: number; narrative: string;
}

export interface CollaborationRecord {
  id: string; title: string; collaboration: number; lenses: BehavioralLens; narrative: string;
}
export interface CollaborationSuite {
  records: CollaborationRecord[]; score: number; collaborationIndex: number; narrative: string;
}

export interface ChangeAdoptionRecord {
  id: string; title: string; adoption: number; lenses: BehavioralLens; narrative: string;
}
export interface ChangeAdoptionSuite {
  records: ChangeAdoptionRecord[]; score: number; adoptionIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: BehavioralPriorityBand; source: string;
  score: number; lenses: BehavioralLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface BehavioralKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: BehavioralMetadata;
}
export interface BehavioralKnowledgeContribution {
  artifacts: BehavioralKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"stakeholder" | "reputation" | "human-capital" | "customer" | "opportunity" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface BehavioralRecommendationRecord {
  id: string; title: string; priority: BehavioralPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: BehavioralLens; narrative: string;
}
export interface BehavioralRiskRecord {
  id: string; title: string; area: BehavioralArea; severity: BehavioralPriorityBand;
  score: number; mitigation: string; lenses: BehavioralLens; narrative: string;
}
export interface BehavioralOpportunityRecord {
  id: string; title: string; area: BehavioralArea; priority: BehavioralPriorityBand;
  score: number; lenses: BehavioralLens; narrative: string;
}

export interface BehavioralDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<BehavioralArea, number>; outlook: BehavioralOutlook;
  decisionConfidence: number; motivationAlignment: number; changeResistance: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface DecisionIntelligenceDashboard {
  generatedAt: string; headline: string; score: number;
  decisionIndex: number; signals: string[]; narrative: string;
}
export interface OrganizationalChangeDashboard {
  generatedAt: string; headline: string; score: number;
  changeResistance: number; signals: string[]; narrative: string;
}
export interface LeadershipDashboard {
  generatedAt: string; headline: string; score: number;
  leadershipReadiness: number; signals: string[]; narrative: string;
}
export interface TeamDynamicsDashboard {
  generatedAt: string; headline: string; score: number;
  teamCohesion: number; signals: string[]; narrative: string;
}
export interface CollaborationDashboard {
  generatedAt: string; headline: string; score: number;
  collaborationIndex: number; signals: string[]; narrative: string;
}
export interface AdoptionForecastDashboard {
  generatedAt: string; headline: string; score: number;
  adoptionProbability: number; signals: string[]; narrative: string;
}
export interface BehavioralOutlookDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: BehavioralOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveBehavioralBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: BehavioralOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: BehavioralLens; narrative: string;
}
export interface BoardBehavioralReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: BehavioralOutlook; decisionScore: number;
  motivationScore: number; adoptionScore: number; recommendations: string[];
  lenses: BehavioralLens; narrative: string;
}
export interface BehavioralHealthScore {
  overallScore: number; status: BehavioralHealthStatus; outlook: BehavioralOutlook;
  areaScores: Record<BehavioralArea, number>; decisionScore: number;
  motivationScore: number; collaborationScore: number; adoptionScore: number;
  forecastScore: number; scenarioScore: number; lenses: BehavioralLens; narrative: string;
}
export interface BehavioralReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: BehavioralConfidenceScore; narrative: string;
}
export interface BehavioralProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<BehavioralArea, number>; outlook: BehavioralOutlook;
  forecast: number; dashboard: BehavioralDashboard; brief: ExecutiveBehavioralBrief;
  overallConfidence: BehavioralConfidenceScore;
}
export interface BehavioralHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: BehavioralArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: BehavioralMetadata;
}
export interface BehavioralPublisher { domain: string; capability: string; }
export interface BehavioralQueryRequest {
  question: string;
  focus?: "general" | BehavioralArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface BehavioralQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: BehavioralConfidenceScore;
}

export interface BehavioralRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  stakeholderResult?: StakeholderResultLight; reputationResult?: ReputationResultLight;
  humanCapitalResult?: HumanCapitalResultLight; customerResult?: CustomerResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight; knowledgeResult?: KnowledgeResultLight;
  baselineOverrides?: Partial<BehavioralBaseline>; metadata?: BehavioralMetadata;
}

export interface BehavioralResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: BehavioralBaseline;
  healthScore: BehavioralScore;
  decisionBehaviorScore: BehavioralScore;
  cognitiveBiasScore: BehavioralScore;
  motivationScore: BehavioralScore;
  incentiveModelingScore: BehavioralScore;
  organizationalChangeScore: BehavioralScore;
  changeResistanceScore: BehavioralScore;
  leadershipBehaviorScore: BehavioralScore;
  teamDynamicsScore: BehavioralScore;
  collaborationScore: BehavioralScore;
  communicationPatternsScore: BehavioralScore;
  conflictBehaviorScore: BehavioralScore;
  customerBehaviorScore: BehavioralScore;
  employeeBehaviorScore: BehavioralScore;
  learningAdaptationScore: BehavioralScore;
  adoptionForecastingScore: BehavioralScore;
  behavioralRiskScore: BehavioralScore;
  behavioralOpportunityScore: BehavioralScore;
  forecastScore: BehavioralScore; scenarioScore: BehavioralScore; analysisScore: BehavioralScore;
  earlyWarningScore: BehavioralScore;
  decisionModelingScore: BehavioralScore;
  changeAdoptionScore: BehavioralScore;
  health: BehavioralHealthScore; dashboard: BehavioralDashboard;
  decisionIntelligenceDashboard: DecisionIntelligenceDashboard;
  organizationalChangeDashboard: OrganizationalChangeDashboard;
  leadershipDashboard: LeadershipDashboard;
  teamDynamicsDashboard: TeamDynamicsDashboard;
  collaborationDashboard: CollaborationDashboard;
  adoptionForecastDashboard: AdoptionForecastDashboard;
  outlookDashboard: BehavioralOutlookDashboard;
  brief: ExecutiveBehavioralBrief; boardReport: BoardBehavioralReport;
  recommendations: BehavioralRecommendationRecord[]; risks: BehavioralRiskRecord[];
  opportunities: BehavioralOpportunityRecord[];
  areaSuites: Record<BehavioralArea, BehavioralAreaSuite>;
  trendSuite: BehavioralTrendSuite; forecastSuite: BehavioralForecastSuite;
  scenarioSuite: BehavioralScenarioSuite; analysisSuite: BehavioralAnalysisSuite;
  decisionModelingSuite: DecisionModelingSuite;
  cognitiveBiasSuite: CognitiveBiasSuite;
  motivationSuite: MotivationSuite;
  collaborationSuite: CollaborationSuite;
  changeAdoptionSuite: ChangeAdoptionSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: BehavioralKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: BehavioralReasoningResult; projection: BehavioralProjectionResult;
  historyRecord: BehavioralHistoryRecord; confidence: BehavioralConfidenceScore;
  requestMetadata: BehavioralMetadata;
}
