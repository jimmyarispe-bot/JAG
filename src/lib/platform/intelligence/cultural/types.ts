/**
 * Cultural Intelligence — shared types / DTOs.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const CULTURAL_INTELLIGENCE_VERSION = "0.1.0";
export const CULTURAL_CAPABILITIES = [
  "organizational_culture", "team_culture", "leadership_culture", "mission_alignment", "values_alignment",
  "employee_engagement", "collaboration_culture", "communication_culture", "innovation_culture", "learning_culture",
  "psychological_safety", "inclusion_belonging", "cross_cultural", "community_culture", "cultural_risk",
  "cultural_opportunity", "cultural_transformation",
  "cultural_analysis", "culture_mapping", "engagement_analysis", "mission_alignment_analysis", "values_alignment_analysis",
  "collaboration_analysis", "cultural_trends", "cultural_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution",
  "closed_learning_loop",
] as const;
export const CULTURAL_AREAS = [
  "organizational_culture", "team_culture", "leadership_culture", "mission_alignment", "values_alignment",
  "employee_engagement", "collaboration_culture", "communication_culture", "innovation_culture", "learning_culture",
  "psychological_safety", "inclusion_belonging", "cross_cultural", "community_culture", "cultural_risk",
  "cultural_opportunity", "cultural_transformation",
] as const;
export const CULTURAL_SCENARIOS = [
  "culture_fragmentation", "values_drift", "engagement_collapse", "psychological_safety_failure",
  "mission_misalignment", "innovation_stagnation", "inclusion_backslide", "collaboration_breakdown",
  "transformation_resistance", "cross_cultural_friction",
] as const;
export const CULTURAL_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "culture_mapping", "mission_alignment", "values_alignment",
  "engagement_quality", "collaboration_quality", "innovation_readiness", "psychological_safety",
  "cultural_risk", "early_warning",
] as const;
export const CULTURAL_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const CULTURAL_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const CULTURAL_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const CULTURAL_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const CULTURAL_OUTLOOKS = ["cohesive", "stable", "fragmented", "volatile", "uncertain"] as const;

export type CulturalCapability = typeof CULTURAL_CAPABILITIES[number];
export type CulturalArea = typeof CULTURAL_AREAS[number];
export type CulturalScenarioKind = typeof CULTURAL_SCENARIOS[number];
export type CulturalAnalysisKind = typeof CULTURAL_ANALYSIS_KINDS[number];
export type CulturalHealthStatus = typeof CULTURAL_HEALTH_STATUSES[number];
export type CulturalPriorityBand = typeof CULTURAL_PRIORITY_BANDS[number];
export type CulturalArtifactStatus = typeof CULTURAL_ARTIFACT_STATUSES[number];
export type CulturalConfidenceLevel = typeof CULTURAL_CONFIDENCE_LEVELS[number];
export type CulturalOutlook = typeof CULTURAL_OUTLOOKS[number];
export type CulturalMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every cultural recommendation answers these eight leadership questions. */
export interface CulturalLens {
  missionAlignment: string;
  valuesAlignment: string;
  culturalHealth: string;
  collaborationQuality: string;
  innovationReadiness: string;
  psychologicalSafety: string;
  engagement: string;
  longTermCulturalOutlook: string;
}

export interface CulturalScore { key: string; label: string; value: number; status: CulturalHealthStatus; band: CulturalPriorityBand; narrative: string; }
export interface CulturalConfidenceScore { value: number; level: CulturalConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  decisionBehaviorScore?: { value?: number };
  motivationScore?: { value?: number };
  collaborationScore?: { value?: number };
}
export interface StakeholderResultLight extends ResultLightBase {
  stakeholderScore?: { value?: number };
  trustLevel?: number;
  engagementQuality?: number;
  relationshipStrength?: number;
}
export interface HumanCapitalResultLight extends ResultLightBase {
  humanCapitalScore?: { value?: number };
  engagementScore?: { value?: number };
  leadershipScore?: { value?: number };
}
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
/** Soft-read when knowledge context is attached (future-ready soft optional light). */
export interface KnowledgeResultLight extends ResultLightBase {
  knowledgeScore?: { value?: number };
  coverageScore?: { value?: number };
}

export interface CulturalBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<CulturalArea, number>;
  missionAlignment: number;
  valuesAlignment: number;
  culturalHealth: number;
  collaborationQuality: number;
  innovationReadiness: number;
  psychologicalSafety: number;
  engagement: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface CulturalAreaRecord {
  id: string; area: CulturalArea; title: string; score: number; status: CulturalArtifactStatus;
  signal: string; evidence: string[]; lenses: CulturalLens; narrative: string;
}
export interface CulturalAreaSuite {
  area: CulturalArea; records: CulturalAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface CulturalTrendRecord {
  id: string; area: CulturalArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: CulturalConfidenceLevel; lenses: CulturalLens; narrative: string;
}
export interface CulturalTrendSuite { trends: CulturalTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface CulturalForecastRecord {
  id: string; area: CulturalArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: CulturalConfidenceLevel; lenses: CulturalLens; narrative: string;
}
export interface CulturalForecastSuite {
  forecasts: CulturalForecastRecord[]; outlook: CulturalOutlook;
  maturityScore: number; narrative: string;
}

export interface CulturalScenarioRecord {
  id: string; kind: CulturalScenarioKind; title: string; probability: number;
  severity: CulturalPriorityBand; organizationalImpact: number;
  missionImpact: number; engagementImpact: number; monitors: string[];
  lenses: CulturalLens; narrative: string;
}
export interface CulturalScenarioSuite {
  scenarios: CulturalScenarioRecord[]; primaryScenario: CulturalScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface CulturalAnalysisRecord {
  id: string; kind: CulturalAnalysisKind; title: string; score: number;
  status: CulturalArtifactStatus; lenses: CulturalLens; narrative: string;
}
export interface CulturalAnalysisSuite {
  analyses: CulturalAnalysisRecord[]; kindsCovered: CulturalAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface CultureMappingRecord {
  id: string; title: string; confidence: number; lenses: CulturalLens; narrative: string;
}
export interface CultureMappingSuite {
  records: CultureMappingRecord[]; score: number; cultureIndex: number; narrative: string;
}

export interface EngagementRecord {
  id: string; title: string; engagement: number; lenses: CulturalLens; narrative: string;
}
export interface EngagementSuite {
  records: EngagementRecord[]; score: number; engagementIndex: number; narrative: string;
}

export interface MissionAlignmentRecord {
  id: string; title: string; alignment: number; lenses: CulturalLens; narrative: string;
}
export interface MissionAlignmentSuite {
  records: MissionAlignmentRecord[]; score: number; missionIndex: number; narrative: string;
}

export interface ValuesAlignmentRecord {
  id: string; title: string; alignment: number; lenses: CulturalLens; narrative: string;
}
export interface ValuesAlignmentSuite {
  records: ValuesAlignmentRecord[]; score: number; valuesIndex: number; narrative: string;
}

export interface CollaborationRecord {
  id: string; title: string; collaboration: number; lenses: CulturalLens; narrative: string;
}
export interface CollaborationSuite {
  records: CollaborationRecord[]; score: number; collaborationIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: CulturalPriorityBand; source: string;
  score: number; lenses: CulturalLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface CulturalKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: CulturalMetadata;
}
export interface CulturalKnowledgeContribution {
  artifacts: CulturalKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"behavioral" | "stakeholder" | "human-capital" | "opportunity" | "knowledge" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface CulturalRecommendationRecord {
  id: string; title: string; priority: CulturalPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: CulturalLens; narrative: string;
}
export interface CulturalRiskRecord {
  id: string; title: string; area: CulturalArea; severity: CulturalPriorityBand;
  score: number; mitigation: string; lenses: CulturalLens; narrative: string;
}
export interface CulturalOpportunityRecord {
  id: string; title: string; area: CulturalArea; priority: CulturalPriorityBand;
  score: number; lenses: CulturalLens; narrative: string;
}

export interface CulturalDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<CulturalArea, number>; outlook: CulturalOutlook;
  missionAlignment: number; valuesAlignment: number; engagement: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface OrganizationalCultureDashboard {
  generatedAt: string; headline: string; score: number;
  cultureIndex: number; signals: string[]; narrative: string;
}
export interface MissionValuesDashboard {
  generatedAt: string; headline: string; score: number;
  missionAlignment: number; valuesAlignment: number; signals: string[]; narrative: string;
}
export interface EmployeeEngagementDashboard {
  generatedAt: string; headline: string; score: number;
  engagement: number; signals: string[]; narrative: string;
}
export interface CollaborationDashboard {
  generatedAt: string; headline: string; score: number;
  collaborationIndex: number; signals: string[]; narrative: string;
}
export interface InnovationCultureDashboard {
  generatedAt: string; headline: string; score: number;
  innovationReadiness: number; signals: string[]; narrative: string;
}
export interface CulturalTransformationDashboard {
  generatedAt: string; headline: string; score: number;
  transformationScore: number; signals: string[]; narrative: string;
}
export interface CulturalForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: CulturalOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveCulturalBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: CulturalOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: CulturalLens; narrative: string;
}
export interface BoardCulturalReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: CulturalOutlook; missionScore: number;
  engagementScore: number; valuesScore: number; recommendations: string[];
  lenses: CulturalLens; narrative: string;
}
export interface CulturalHealthScore {
  overallScore: number; status: CulturalHealthStatus; outlook: CulturalOutlook;
  areaScores: Record<CulturalArea, number>; missionScore: number;
  engagementScore: number; collaborationScore: number; valuesScore: number;
  forecastScore: number; scenarioScore: number; lenses: CulturalLens; narrative: string;
}
export interface CulturalReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: CulturalConfidenceScore; narrative: string;
}
export interface CulturalProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<CulturalArea, number>; outlook: CulturalOutlook;
  forecast: number; dashboard: CulturalDashboard; brief: ExecutiveCulturalBrief;
  overallConfidence: CulturalConfidenceScore;
}
export interface CulturalHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: CulturalArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: CulturalMetadata;
}
export interface CulturalPublisher { domain: string; capability: string; }
export interface CulturalQueryRequest {
  question: string;
  focus?: "general" | CulturalArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface CulturalQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: CulturalConfidenceScore;
}

export interface CulturalRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  behavioralResult?: BehavioralResultLight; stakeholderResult?: StakeholderResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight; knowledgeResult?: KnowledgeResultLight;
  baselineOverrides?: Partial<CulturalBaseline>; metadata?: CulturalMetadata;
}

export interface CulturalResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: CulturalBaseline;
  healthScore: CulturalScore;
  organizationalCultureScore: CulturalScore;
  teamCultureScore: CulturalScore;
  leadershipCultureScore: CulturalScore;
  missionAlignmentScore: CulturalScore;
  valuesAlignmentScore: CulturalScore;
  employeeEngagementScore: CulturalScore;
  collaborationCultureScore: CulturalScore;
  communicationCultureScore: CulturalScore;
  innovationCultureScore: CulturalScore;
  learningCultureScore: CulturalScore;
  psychologicalSafetyScore: CulturalScore;
  inclusionBelongingScore: CulturalScore;
  crossCulturalScore: CulturalScore;
  communityCultureScore: CulturalScore;
  culturalRiskScore: CulturalScore;
  culturalOpportunityScore: CulturalScore;
  culturalTransformationScore: CulturalScore;
  forecastScore: CulturalScore; scenarioScore: CulturalScore; analysisScore: CulturalScore;
  earlyWarningScore: CulturalScore;
  cultureMappingScore: CulturalScore;
  engagementScore: CulturalScore;
  health: CulturalHealthScore; dashboard: CulturalDashboard;
  organizationalCultureDashboard: OrganizationalCultureDashboard;
  missionValuesDashboard: MissionValuesDashboard;
  employeeEngagementDashboard: EmployeeEngagementDashboard;
  collaborationDashboard: CollaborationDashboard;
  innovationCultureDashboard: InnovationCultureDashboard;
  culturalTransformationDashboard: CulturalTransformationDashboard;
  forecastDashboard: CulturalForecastDashboard;
  brief: ExecutiveCulturalBrief; boardReport: BoardCulturalReport;
  recommendations: CulturalRecommendationRecord[]; risks: CulturalRiskRecord[];
  opportunities: CulturalOpportunityRecord[];
  areaSuites: Record<CulturalArea, CulturalAreaSuite>;
  trendSuite: CulturalTrendSuite; forecastSuite: CulturalForecastSuite;
  scenarioSuite: CulturalScenarioSuite; analysisSuite: CulturalAnalysisSuite;
  cultureMappingSuite: CultureMappingSuite;
  engagementSuite: EngagementSuite;
  missionAlignmentSuite: MissionAlignmentSuite;
  valuesAlignmentSuite: ValuesAlignmentSuite;
  collaborationSuite: CollaborationSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: CulturalKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: CulturalReasoningResult; projection: CulturalProjectionResult;
  historyRecord: CulturalHistoryRecord; confidence: CulturalConfidenceScore;
  requestMetadata: CulturalMetadata;
}
