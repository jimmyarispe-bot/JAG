import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const RESILIENCE_INTELLIGENCE_VERSION = "0.1.0";
export const RESILIENCE_CAPABILITIES = [
  "organizational_resilience", "business_continuity", "disaster_recovery", "operational_recovery", "financial_resilience", "workforce_resilience", "supply_chain_resilience", "cyber_resilience", "infrastructure_resilience", "vendor_resilience", "crisis_readiness", "adaptive_capacity", "redundancy_planning", "recovery_time_analysis", "stress_testing", "resilience_optimization", "long_term_adaptability", "resilience_analysis", "stress_testing_engine", "recovery_analysis", "continuity_analysis", "adaptive_capacity_analysis", "resilience_trends", "resilience_forecasts", "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
] as const;
export const RESILIENCE_AREAS = [
  "organizational_resilience", "business_continuity", "disaster_recovery", "operational_recovery", "financial_resilience", "workforce_resilience", "supply_chain_resilience", "cyber_resilience", "infrastructure_resilience", "vendor_resilience", "crisis_readiness", "adaptive_capacity", "redundancy_planning", "recovery_time_analysis", "stress_testing", "resilience_optimization", "long_term_adaptability",
] as const;
export const RESILIENCE_SCENARIOS = [
  "operational_outage", "financial_shock", "workforce_disruption", "supply_chain_break",
  "cyber_incident", "infrastructure_failure", "vendor_collapse", "multi_hazard_cascade",
  "recovery_overrun", "adaptive_capacity_exhaustion",
] as const;
export const RESILIENCE_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "organizational_readiness", "recovery_capability",
  "operational_stability", "financial_stability", "workforce_stability", "infrastructure_readiness",
  "adaptive_capacity", "stress_testing", "early_warning",
] as const;
export const RESILIENCE_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const RESILIENCE_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const RESILIENCE_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const RESILIENCE_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const RESILIENCE_OUTLOOKS = ["hardened", "stable", "fragile", "volatile", "uncertain"] as const;

export type ResilienceCapability = typeof RESILIENCE_CAPABILITIES[number];
export type ResilienceArea = typeof RESILIENCE_AREAS[number];
export type ResilienceScenarioKind = typeof RESILIENCE_SCENARIOS[number];
export type ResilienceAnalysisKind = typeof RESILIENCE_ANALYSIS_KINDS[number];
export type ResilienceHealthStatus = typeof RESILIENCE_HEALTH_STATUSES[number];
export type ResiliencePriorityBand = typeof RESILIENCE_PRIORITY_BANDS[number];
export type ResilienceArtifactStatus = typeof RESILIENCE_ARTIFACT_STATUSES[number];
export type ResilienceConfidenceLevel = typeof RESILIENCE_CONFIDENCE_LEVELS[number];
export type ResilienceOutlook = typeof RESILIENCE_OUTLOOKS[number];
export type ResilienceMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every resilience recommendation answers these eight leadership questions. */
export interface ResilienceLens {
  organizationalReadiness: string;
  recoveryCapability: string;
  operationalStability: string;
  financialStability: string;
  workforceStability: string;
  infrastructureReadiness: string;
  adaptiveCapacity: string;
  longTermResilienceOutlook: string;
}

export interface ResilienceScore { key: string; label: string; value: number; status: ResilienceHealthStatus; band: ResiliencePriorityBand; narrative: string; }
export interface ResilienceConfidenceScore { value: number; level: ResilienceConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface SystemsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptability?: number;
  cascadingRisk?: number;
}
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
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }

export interface ResilienceBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<ResilienceArea, number>;
  organizationalReadiness: number;
  recoveryCapability: number;
  operationalStability: number;
  financialStability: number;
  workforceStability: number;
  infrastructureReadiness: number;
  adaptiveCapacity: number;
  longTermResilienceOutlook: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface ResilienceAreaRecord {
  id: string; area: ResilienceArea; title: string; score: number; status: ResilienceArtifactStatus;
  signal: string; evidence: string[]; lenses: ResilienceLens; narrative: string;
}
export interface ResilienceAreaSuite {
  area: ResilienceArea; records: ResilienceAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface ResilienceTrendRecord {
  id: string; area: ResilienceArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: ResilienceConfidenceLevel; lenses: ResilienceLens; narrative: string;
}
export interface ResilienceTrendSuite { trends: ResilienceTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface ResilienceForecastRecord {
  id: string; area: ResilienceArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: ResilienceConfidenceLevel; lenses: ResilienceLens; narrative: string;
}
export interface ResilienceForecastSuite {
  forecasts: ResilienceForecastRecord[]; outlook: ResilienceOutlook;
  maturityScore: number; narrative: string;
}

export interface ResilienceScenarioRecord {
  id: string; kind: ResilienceScenarioKind; title: string; probability: number;
  severity: ResiliencePriorityBand; organizationalImpact: number;
  recoveryImpact: number; continuityImpact: number; monitors: string[];
  lenses: ResilienceLens; narrative: string;
}
export interface ResilienceScenarioSuite {
  scenarios: ResilienceScenarioRecord[]; primaryScenario: ResilienceScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface ResilienceAnalysisRecord {
  id: string; kind: ResilienceAnalysisKind; title: string; score: number;
  status: ResilienceArtifactStatus; lenses: ResilienceLens; narrative: string;
}
export interface ResilienceAnalysisSuite {
  analyses: ResilienceAnalysisRecord[]; kindsCovered: ResilienceAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface StressTestRecord {
  id: string; title: string; severity: number; lenses: ResilienceLens; narrative: string;
}
export interface StressTestSuite {
  records: StressTestRecord[]; score: number; stressIndex: number; narrative: string;
}

export interface RecoveryRecord {
  id: string; title: string; recoveryTime: number; lenses: ResilienceLens; narrative: string;
}
export interface RecoverySuite {
  records: RecoveryRecord[]; score: number; recoveryIndex: number; narrative: string;
}

export interface ContinuityRecord {
  id: string; title: string; continuity: number; lenses: ResilienceLens; narrative: string;
}
export interface ContinuitySuite {
  records: ContinuityRecord[]; score: number; continuityIndex: number; narrative: string;
}

export interface AdaptiveCapacityRecord {
  id: string; title: string; capacity: number; lenses: ResilienceLens; narrative: string;
}
export interface AdaptiveCapacitySuite {
  records: AdaptiveCapacityRecord[]; score: number; adaptiveIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: ResiliencePriorityBand; source: string;
  score: number; lenses: ResilienceLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface ResilienceKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: ResilienceMetadata;
}
export interface ResilienceKnowledgeContribution {
  artifacts: ResilienceKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"systems" | "operations" | "legal-compliance-risk" | "economic" | "executive-decision" | "predictive" | "opportunity">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface ResilienceRecommendationRecord {
  id: string; title: string; priority: ResiliencePriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: ResilienceLens; narrative: string;
}
export interface ResilienceRiskRecord {
  id: string; title: string; area: ResilienceArea; severity: ResiliencePriorityBand;
  score: number; mitigation: string; lenses: ResilienceLens; narrative: string;
}
export interface ResilienceOpportunityRecord {
  id: string; title: string; area: ResilienceArea; priority: ResiliencePriorityBand;
  score: number; lenses: ResilienceLens; narrative: string;
}

export interface ResilienceDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<ResilienceArea, number>; outlook: ResilienceOutlook;
  organizationalReadiness: number; recoveryCapability: number; adaptiveCapacity: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface BusinessContinuityDashboard {
  generatedAt: string; headline: string; score: number;
  continuityIndex: number; signals: string[]; narrative: string;
}
export interface DisasterRecoveryDashboard {
  generatedAt: string; headline: string; score: number;
  recoveryIndex: number; signals: string[]; narrative: string;
}
export interface OperationalStabilityDashboard {
  generatedAt: string; headline: string; score: number;
  stabilityIndex: number; signals: string[]; narrative: string;
}
export interface FinancialResilienceDashboard {
  generatedAt: string; headline: string; score: number;
  financialIndex: number; signals: string[]; narrative: string;
}
export interface CyberInfrastructureDashboard {
  generatedAt: string; headline: string; score: number;
  cyberIndex: number; signals: string[]; narrative: string;
}
export interface StressTestingDashboard {
  generatedAt: string; headline: string; score: number;
  stressIndex: number; signals: string[]; narrative: string;
}
export interface ResilienceForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: ResilienceOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveResilienceBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: ResilienceOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: ResilienceLens; narrative: string;
}
export interface BoardResilienceReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: ResilienceOutlook; continuityScore: number;
  recoveryScore: number; adaptiveScore: number; recommendations: string[];
  lenses: ResilienceLens; narrative: string;
}
export interface ResilienceHealthScore {
  overallScore: number; status: ResilienceHealthStatus; outlook: ResilienceOutlook;
  areaScores: Record<ResilienceArea, number>; continuityScore: number;
  recoveryScore: number; adaptiveScore: number; stressTestScore: number;
  forecastScore: number; scenarioScore: number; lenses: ResilienceLens; narrative: string;
}
export interface ResilienceReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: ResilienceConfidenceScore; narrative: string;
}
export interface ResilienceProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<ResilienceArea, number>; outlook: ResilienceOutlook;
  forecast: number; dashboard: ResilienceDashboard; brief: ExecutiveResilienceBrief;
  overallConfidence: ResilienceConfidenceScore;
}
export interface ResilienceHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: ResilienceArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: ResilienceMetadata;
}
export interface ResiliencePublisher { domain: string; capability: string; }
export interface ResilienceQueryRequest {
  question: string;
  focus?: "general" | ResilienceArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface ResilienceQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: ResilienceConfidenceScore;
}

export interface ResilienceRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  systemsResult?: SystemsResultLight;
  operationsResult?: OperationsResultLight;
  legalComplianceRiskResult?: LegalComplianceRiskResultLight;
  predictiveResult?: PredictiveResultLight;
  decisionResult?: DecisionResultLight;
  economicResult?: EconomicResultLight;
  opportunityResult?: OpportunityResultLight;
  baselineOverrides?: Partial<ResilienceBaseline>; metadata?: ResilienceMetadata;
}

export interface ResilienceResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: ResilienceBaseline;
  healthScore: ResilienceScore;
  organizationalResilienceScore: ResilienceScore;
  businessContinuityScore: ResilienceScore;
  disasterRecoveryScore: ResilienceScore;
  operationalRecoveryScore: ResilienceScore;
  financialResilienceScore: ResilienceScore;
  workforceResilienceScore: ResilienceScore;
  supplyChainResilienceScore: ResilienceScore;
  cyberResilienceScore: ResilienceScore;
  infrastructureResilienceScore: ResilienceScore;
  vendorResilienceScore: ResilienceScore;
  crisisReadinessScore: ResilienceScore;
  adaptiveCapacityScore: ResilienceScore;
  redundancyPlanningScore: ResilienceScore;
  recoveryTimeAnalysisScore: ResilienceScore;
  stressTestingScore: ResilienceScore;
  resilienceOptimizationScore: ResilienceScore;
  longTermAdaptabilityScore: ResilienceScore;
  forecastScore: ResilienceScore; scenarioScore: ResilienceScore; analysisScore: ResilienceScore;
  earlyWarningScore: ResilienceScore;
  stressTestScore: ResilienceScore; recoveryScore: ResilienceScore;
  continuityScore: ResilienceScore;
  health: ResilienceHealthScore; dashboard: ResilienceDashboard;
  businessContinuityDashboard: BusinessContinuityDashboard;
  disasterRecoveryDashboard: DisasterRecoveryDashboard;
  operationalStabilityDashboard: OperationalStabilityDashboard;
  financialResilienceDashboard: FinancialResilienceDashboard;
  cyberInfrastructureDashboard: CyberInfrastructureDashboard;
  stressTestingDashboard: StressTestingDashboard;
  forecastDashboard: ResilienceForecastDashboard;
  brief: ExecutiveResilienceBrief; boardReport: BoardResilienceReport;
  recommendations: ResilienceRecommendationRecord[]; risks: ResilienceRiskRecord[];
  opportunities: ResilienceOpportunityRecord[];
  areaSuites: Record<ResilienceArea, ResilienceAreaSuite>;
  trendSuite: ResilienceTrendSuite; forecastSuite: ResilienceForecastSuite;
  scenarioSuite: ResilienceScenarioSuite; analysisSuite: ResilienceAnalysisSuite;
  stressTestSuite: StressTestSuite;
  recoverySuite: RecoverySuite;
  continuitySuite: ContinuitySuite;
  adaptiveCapacitySuite: AdaptiveCapacitySuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: ResilienceKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: ResilienceReasoningResult; projection: ResilienceProjectionResult;
  historyRecord: ResilienceHistoryRecord; confidence: ResilienceConfidenceScore;
  requestMetadata: ResilienceMetadata;
}
