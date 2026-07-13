import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const SYSTEMS_INTELLIGENCE_VERSION = "0.1.0";
export const SYSTEMS_CAPABILITIES = [
  "system_mapping", "dependency_analysis", "feedback_loop_analysis", "constraint_identification", "bottleneck_detection", "flow_optimization", "emergent_behavior", "network_dynamics", "organizational_complexity", "interdependency_modeling", "cascading_risk", "system_stability", "leverage_point_identification", "resource_flow", "adaptive_capacity", "system_evolution", "scenario_interaction", "systems_analysis", "dependency_analysis_engine", "feedback_loop_analysis_engine", "constraint_analysis", "bottleneck_analysis", "network_dynamics_analysis", "systems_trends", "systems_forecasts", "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
] as const;
export const SYSTEMS_AREAS = [
  "system_mapping", "dependency_analysis", "feedback_loop_analysis", "constraint_identification", "bottleneck_detection", "flow_optimization", "emergent_behavior", "network_dynamics", "organizational_complexity", "interdependency_modeling", "cascading_risk", "system_stability", "leverage_point_identification", "resource_flow", "adaptive_capacity", "system_evolution", "scenario_interaction",
] as const;
export const SYSTEMS_SCENARIOS = [
  "cascade_failure", "bottleneck_saturation", "feedback_instability", "constraint_lock",
  "complexity_overload", "dependency_shock", "flow_collapse", "adaptive_capacity_loss",
  "leverage_misapplication", "emergent_dysfunction",
] as const;
export const SYSTEMS_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "dependency_impact", "bottleneck_risk", "feedback_stability",
  "system_complexity", "resource_flow", "cascading_risk", "adaptability", "leverage_points", "early_warning",
] as const;
export const SYSTEMS_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const SYSTEMS_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const SYSTEMS_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const SYSTEMS_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const SYSTEMS_OUTLOOKS = ["stable", "adaptive", "constrained", "volatile", "uncertain"] as const;

export type SystemsCapability = typeof SYSTEMS_CAPABILITIES[number];
export type SystemsArea = typeof SYSTEMS_AREAS[number];
export type SystemsScenarioKind = typeof SYSTEMS_SCENARIOS[number];
export type SystemsAnalysisKind = typeof SYSTEMS_ANALYSIS_KINDS[number];
export type SystemsHealthStatus = typeof SYSTEMS_HEALTH_STATUSES[number];
export type SystemsPriorityBand = typeof SYSTEMS_PRIORITY_BANDS[number];
export type SystemsArtifactStatus = typeof SYSTEMS_ARTIFACT_STATUSES[number];
export type SystemsConfidenceLevel = typeof SYSTEMS_CONFIDENCE_LEVELS[number];
export type SystemsOutlook = typeof SYSTEMS_OUTLOOKS[number];
export type SystemsMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every systems recommendation answers these eight leadership questions. */
export interface SystemsLens {
  dependencyImpact: string;
  bottleneckRisk: string;
  feedbackStability: string;
  systemComplexity: string;
  resourceFlow: string;
  cascadingRisk: string;
  adaptability: string;
  longTermSystemHealth: string;
}

export interface SystemsScore { key: string; label: string; value: number; status: SystemsHealthStatus; band: SystemsPriorityBand; narrative: string; }
export interface SystemsConfidenceScore { value: number; level: SystemsConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface OperationsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  throughputScore?: { value?: number };
}
export interface LegalComplianceRiskResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  legalRiskScore?: { value?: number };
  complianceScore?: { value?: number };
}
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface EconomicResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  economicScore?: { value?: number };
}
export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  decisionBehaviorScore?: { value?: number };
  collaborationScore?: { value?: number };
}
export interface EthicalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  fairnessScore?: { value?: number };
  accountabilityScore?: { value?: number };
}
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }

export interface SystemsBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<SystemsArea, number>;
  dependencyImpact: number;
  bottleneckRisk: number;
  feedbackStability: number;
  systemComplexity: number;
  resourceFlow: number;
  cascadingRisk: number;
  adaptability: number;
  longTermSystemHealth: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface SystemsAreaRecord {
  id: string; area: SystemsArea; title: string; score: number; status: SystemsArtifactStatus;
  signal: string; evidence: string[]; lenses: SystemsLens; narrative: string;
}
export interface SystemsAreaSuite {
  area: SystemsArea; records: SystemsAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface SystemsTrendRecord {
  id: string; area: SystemsArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: SystemsConfidenceLevel; lenses: SystemsLens; narrative: string;
}
export interface SystemsTrendSuite { trends: SystemsTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface SystemsForecastRecord {
  id: string; area: SystemsArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: SystemsConfidenceLevel; lenses: SystemsLens; narrative: string;
}
export interface SystemsForecastSuite {
  forecasts: SystemsForecastRecord[]; outlook: SystemsOutlook;
  maturityScore: number; narrative: string;
}

export interface SystemsScenarioRecord {
  id: string; kind: SystemsScenarioKind; title: string; probability: number;
  severity: SystemsPriorityBand; organizationalImpact: number;
  dependencyImpact: number; cascadingImpact: number; monitors: string[];
  lenses: SystemsLens; narrative: string;
}
export interface SystemsScenarioSuite {
  scenarios: SystemsScenarioRecord[]; primaryScenario: SystemsScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface SystemsAnalysisRecord {
  id: string; kind: SystemsAnalysisKind; title: string; score: number;
  status: SystemsArtifactStatus; lenses: SystemsLens; narrative: string;
}
export interface SystemsAnalysisSuite {
  analyses: SystemsAnalysisRecord[]; kindsCovered: SystemsAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface DependencyRecord {
  id: string; title: string; strength: number; lenses: SystemsLens; narrative: string;
}
export interface DependencySuite {
  records: DependencyRecord[]; score: number; dependencyIndex: number; narrative: string;
}

export interface FeedbackLoopRecord {
  id: string; title: string; stability: number; lenses: SystemsLens; narrative: string;
}
export interface FeedbackLoopSuite {
  records: FeedbackLoopRecord[]; score: number; feedbackIndex: number; narrative: string;
}

export interface ConstraintRecord {
  id: string; title: string; tightness: number; lenses: SystemsLens; narrative: string;
}
export interface ConstraintSuite {
  records: ConstraintRecord[]; score: number; constraintIndex: number; narrative: string;
}

export interface BottleneckRecord {
  id: string; title: string; saturation: number; lenses: SystemsLens; narrative: string;
}
export interface BottleneckSuite {
  records: BottleneckRecord[]; score: number; bottleneckIndex: number; narrative: string;
}

export interface NetworkDynamicsRecord {
  id: string; title: string; dynamics: number; lenses: SystemsLens; narrative: string;
}
export interface NetworkDynamicsSuite {
  records: NetworkDynamicsRecord[]; score: number; networkIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: SystemsPriorityBand; source: string;
  score: number; lenses: SystemsLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface SystemsKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: SystemsMetadata;
}
export interface SystemsKnowledgeContribution {
  artifacts: SystemsKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"operations" | "legal-compliance-risk" | "predictive" | "executive-decision" | "economic" | "behavioral" | "opportunity">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface SystemsRecommendationRecord {
  id: string; title: string; priority: SystemsPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: SystemsLens; narrative: string;
}
export interface SystemsRiskRecord {
  id: string; title: string; area: SystemsArea; severity: SystemsPriorityBand;
  score: number; mitigation: string; lenses: SystemsLens; narrative: string;
}
export interface SystemsOpportunityRecord {
  id: string; title: string; area: SystemsArea; priority: SystemsPriorityBand;
  score: number; lenses: SystemsLens; narrative: string;
}

export interface SystemsDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<SystemsArea, number>; outlook: SystemsOutlook;
  dependencyImpact: number; bottleneckRisk: number; adaptability: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface DependencyMapDashboard {
  generatedAt: string; headline: string; score: number;
  dependencyIndex: number; signals: string[]; narrative: string;
}
export interface FeedbackLoopsDashboard {
  generatedAt: string; headline: string; score: number;
  feedbackIndex: number; signals: string[]; narrative: string;
}
export interface BottlenecksDashboard {
  generatedAt: string; headline: string; score: number;
  bottleneckIndex: number; signals: string[]; narrative: string;
}
export interface SystemHealthDashboard {
  generatedAt: string; headline: string; score: number;
  stabilityIndex: number; signals: string[]; narrative: string;
}
export interface ComplexityAnalysisDashboard {
  generatedAt: string; headline: string; score: number;
  complexityIndex: number; signals: string[]; narrative: string;
}
export interface AdaptiveCapacityDashboard {
  generatedAt: string; headline: string; score: number;
  adaptiveIndex: number; signals: string[]; narrative: string;
}
export interface SystemsForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: SystemsOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveSystemsBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: SystemsOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: SystemsLens; narrative: string;
}
export interface BoardSystemsReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: SystemsOutlook; dependencyScore: number;
  bottleneckScore: number; adaptiveScore: number; recommendations: string[];
  lenses: SystemsLens; narrative: string;
}
export interface SystemsHealthScore {
  overallScore: number; status: SystemsHealthStatus; outlook: SystemsOutlook;
  areaScores: Record<SystemsArea, number>; dependencyScore: number;
  bottleneckScore: number; adaptiveScore: number; complexityScore: number;
  forecastScore: number; scenarioScore: number; lenses: SystemsLens; narrative: string;
}
export interface SystemsReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: SystemsConfidenceScore; narrative: string;
}
export interface SystemsProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<SystemsArea, number>; outlook: SystemsOutlook;
  forecast: number; dashboard: SystemsDashboard; brief: ExecutiveSystemsBrief;
  overallConfidence: SystemsConfidenceScore;
}
export interface SystemsHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: SystemsArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: SystemsMetadata;
}
export interface SystemsPublisher { domain: string; capability: string; }
export interface SystemsQueryRequest {
  question: string;
  focus?: "general" | SystemsArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface SystemsQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: SystemsConfidenceScore;
}

export interface SystemsRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  operationsResult?: OperationsResultLight;
  legalComplianceRiskResult?: LegalComplianceRiskResultLight;
  predictiveResult?: PredictiveResultLight;
  decisionResult?: DecisionResultLight;
  economicResult?: EconomicResultLight;
  behavioralResult?: BehavioralResultLight;
  ethicalResult?: EthicalResultLight;
  opportunityResult?: OpportunityResultLight;
  baselineOverrides?: Partial<SystemsBaseline>; metadata?: SystemsMetadata;
}

export interface SystemsResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: SystemsBaseline;
  healthScore: SystemsScore;
  systemMappingScore: SystemsScore;
  dependencyAnalysisScore: SystemsScore;
  feedbackLoopAnalysisScore: SystemsScore;
  constraintIdentificationScore: SystemsScore;
  bottleneckDetectionScore: SystemsScore;
  flowOptimizationScore: SystemsScore;
  emergentBehaviorScore: SystemsScore;
  networkDynamicsScore: SystemsScore;
  organizationalComplexityScore: SystemsScore;
  interdependencyModelingScore: SystemsScore;
  cascadingRiskScore: SystemsScore;
  systemStabilityScore: SystemsScore;
  leveragePointIdentificationScore: SystemsScore;
  resourceFlowScore: SystemsScore;
  adaptiveCapacityScore: SystemsScore;
  systemEvolutionScore: SystemsScore;
  scenarioInteractionScore: SystemsScore;
  forecastScore: SystemsScore; scenarioScore: SystemsScore; analysisScore: SystemsScore;
  earlyWarningScore: SystemsScore;
  dependencyScore: SystemsScore; feedbackLoopScore: SystemsScore;
  bottleneckScore: SystemsScore; constraintScore: SystemsScore;
  health: SystemsHealthScore; dashboard: SystemsDashboard;
  dependencyMapDashboard: DependencyMapDashboard;
  feedbackLoopsDashboard: FeedbackLoopsDashboard;
  bottlenecksDashboard: BottlenecksDashboard;
  systemHealthDashboard: SystemHealthDashboard;
  complexityAnalysisDashboard: ComplexityAnalysisDashboard;
  adaptiveCapacityDashboard: AdaptiveCapacityDashboard;
  forecastDashboard: SystemsForecastDashboard;
  brief: ExecutiveSystemsBrief; boardReport: BoardSystemsReport;
  recommendations: SystemsRecommendationRecord[]; risks: SystemsRiskRecord[];
  opportunities: SystemsOpportunityRecord[];
  areaSuites: Record<SystemsArea, SystemsAreaSuite>;
  trendSuite: SystemsTrendSuite; forecastSuite: SystemsForecastSuite;
  scenarioSuite: SystemsScenarioSuite; analysisSuite: SystemsAnalysisSuite;
  dependencySuite: DependencySuite;
  feedbackLoopSuite: FeedbackLoopSuite;
  constraintSuite: ConstraintSuite;
  bottleneckSuite: BottleneckSuite;
  networkDynamicsSuite: NetworkDynamicsSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: SystemsKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: SystemsReasoningResult; projection: SystemsProjectionResult;
  historyRecord: SystemsHistoryRecord; confidence: SystemsConfidenceScore;
  requestMetadata: SystemsMetadata;
}
