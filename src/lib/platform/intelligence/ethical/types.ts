/**
 * Ethical Intelligence — shared types / DTOs.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const ETHICAL_INTELLIGENCE_VERSION = "0.1.0";
export const ETHICAL_CAPABILITIES = [
  "ethical_decision_analysis", "values_alignment", "fairness", "transparency", "accountability",
  "human_impact", "ai_ethics", "responsible_automation", "bias_discrimination", "governance_ethics",
  "privacy_data_ethics", "sustainability_ethics", "social_responsibility", "ethical_risk",
  "ethical_opportunity", "ethical_stewardship", "recommendation_validation",
  "ethical_analysis", "values_alignment_analysis", "fairness_analysis", "human_impact_analysis",
  "ai_ethics_analysis", "governance_ethics_analysis", "ethical_trends", "ethical_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution",
  "closed_learning_loop",
] as const;
export const ETHICAL_AREAS = [
  "ethical_decision_analysis", "values_alignment", "fairness", "transparency", "accountability",
  "human_impact", "ai_ethics", "responsible_automation", "bias_discrimination", "governance_ethics",
  "privacy_data_ethics", "sustainability_ethics", "social_responsibility", "ethical_risk",
  "ethical_opportunity", "ethical_stewardship", "recommendation_validation",
] as const;
export const ETHICAL_SCENARIOS = [
  "values_breach", "fairness_failure", "transparency_collapse", "accountability_gap",
  "human_harm_event", "ai_bias_incident", "privacy_violation", "governance_failure",
  "social_responsibility_backlash", "ethical_decision_paralysis",
] as const;
export const ETHICAL_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "values_alignment", "fairness", "transparency",
  "accountability", "human_impact", "bias_risk", "governance_integrity",
  "ethical_risk", "early_warning",
] as const;
export const ETHICAL_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const ETHICAL_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const ETHICAL_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const ETHICAL_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const ETHICAL_OUTLOOKS = ["principled", "stable", "contested", "volatile", "uncertain"] as const;

export type EthicalCapability = typeof ETHICAL_CAPABILITIES[number];
export type EthicalArea = typeof ETHICAL_AREAS[number];
export type EthicalScenarioKind = typeof ETHICAL_SCENARIOS[number];
export type EthicalAnalysisKind = typeof ETHICAL_ANALYSIS_KINDS[number];
export type EthicalHealthStatus = typeof ETHICAL_HEALTH_STATUSES[number];
export type EthicalPriorityBand = typeof ETHICAL_PRIORITY_BANDS[number];
export type EthicalArtifactStatus = typeof ETHICAL_ARTIFACT_STATUSES[number];
export type EthicalConfidenceLevel = typeof ETHICAL_CONFIDENCE_LEVELS[number];
export type EthicalOutlook = typeof ETHICAL_OUTLOOKS[number];
export type EthicalMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every ethical recommendation answers these eight leadership questions. */
export interface EthicalLens {
  valuesAlignment: string;
  fairness: string;
  transparency: string;
  accountability: string;
  humanImpact: string;
  biasRisk: string;
  governanceIntegrity: string;
  longTermEthicalOutlook: string;
}

export interface EthicalScore { key: string; label: string; value: number; status: EthicalHealthStatus; band: EthicalPriorityBand; narrative: string; }
export interface EthicalConfidenceScore { value: number; level: EthicalConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface CulturalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  valuesAlignmentScore?: { value?: number };
}
export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  decisionBehaviorScore?: { value?: number };
  motivationScore?: { value?: number };
  collaborationScore?: { value?: number };
}
export interface LegalComplianceRiskResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  legalRiskScore?: { value?: number };
  complianceScore?: { value?: number };
}
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface ReputationResultLight extends ResultLightBase {
  reputationScore?: { value?: number };
  trustScore?: { value?: number };
}

export interface EthicalBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<EthicalArea, number>;
  valuesAlignment: number;
  fairness: number;
  transparency: number;
  accountability: number;
  humanImpact: number;
  biasRisk: number;
  governanceIntegrity: number;
  longTermEthicalOutlook: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface EthicalAreaRecord {
  id: string; area: EthicalArea; title: string; score: number; status: EthicalArtifactStatus;
  signal: string; evidence: string[]; lenses: EthicalLens; narrative: string;
}
export interface EthicalAreaSuite {
  area: EthicalArea; records: EthicalAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface EthicalTrendRecord {
  id: string; area: EthicalArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: EthicalConfidenceLevel; lenses: EthicalLens; narrative: string;
}
export interface EthicalTrendSuite { trends: EthicalTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface EthicalForecastRecord {
  id: string; area: EthicalArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: EthicalConfidenceLevel; lenses: EthicalLens; narrative: string;
}
export interface EthicalForecastSuite {
  forecasts: EthicalForecastRecord[]; outlook: EthicalOutlook;
  maturityScore: number; narrative: string;
}

export interface EthicalScenarioRecord {
  id: string; kind: EthicalScenarioKind; title: string; probability: number;
  severity: EthicalPriorityBand; organizationalImpact: number;
  valuesImpact: number; humanImpact: number; monitors: string[];
  lenses: EthicalLens; narrative: string;
}
export interface EthicalScenarioSuite {
  scenarios: EthicalScenarioRecord[]; primaryScenario: EthicalScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface EthicalAnalysisRecord {
  id: string; kind: EthicalAnalysisKind; title: string; score: number;
  status: EthicalArtifactStatus; lenses: EthicalLens; narrative: string;
}
export interface EthicalAnalysisSuite {
  analyses: EthicalAnalysisRecord[]; kindsCovered: EthicalAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface ValuesAlignmentRecord {
  id: string; title: string; alignment: number; lenses: EthicalLens; narrative: string;
}
export interface ValuesAlignmentSuite {
  records: ValuesAlignmentRecord[]; score: number; valuesIndex: number; narrative: string;
}

export interface FairnessRecord {
  id: string; title: string; fairness: number; lenses: EthicalLens; narrative: string;
}
export interface FairnessSuite {
  records: FairnessRecord[]; score: number; fairnessIndex: number; narrative: string;
}

export interface HumanImpactRecord {
  id: string; title: string; impact: number; lenses: EthicalLens; narrative: string;
}
export interface HumanImpactSuite {
  records: HumanImpactRecord[]; score: number; humanImpactIndex: number; narrative: string;
}

export interface AiEthicsRecord {
  id: string; title: string; ethics: number; lenses: EthicalLens; narrative: string;
}
export interface AiEthicsSuite {
  records: AiEthicsRecord[]; score: number; aiEthicsIndex: number; narrative: string;
}

export interface GovernanceEthicsRecord {
  id: string; title: string; integrity: number; lenses: EthicalLens; narrative: string;
}
export interface GovernanceEthicsSuite {
  records: GovernanceEthicsRecord[]; score: number; governanceIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: EthicalPriorityBand; source: string;
  score: number; lenses: EthicalLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface EthicalKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: EthicalMetadata;
}
export interface EthicalKnowledgeContribution {
  artifacts: EthicalKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"cultural" | "behavioral" | "legal-compliance-risk" | "opportunity" | "executive-decision" | "predictive" | "reputation">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface EthicalRecommendationRecord {
  id: string; title: string; priority: EthicalPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: EthicalLens; narrative: string;
}
export interface EthicalRiskRecord {
  id: string; title: string; area: EthicalArea; severity: EthicalPriorityBand;
  score: number; mitigation: string; lenses: EthicalLens; narrative: string;
}
export interface EthicalOpportunityRecord {
  id: string; title: string; area: EthicalArea; priority: EthicalPriorityBand;
  score: number; lenses: EthicalLens; narrative: string;
}

export interface EthicalDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<EthicalArea, number>; outlook: EthicalOutlook;
  valuesAlignment: number; fairness: number; humanImpact: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface ValuesAlignmentDashboard {
  generatedAt: string; headline: string; score: number;
  valuesIndex: number; signals: string[]; narrative: string;
}
export interface FairnessDashboard {
  generatedAt: string; headline: string; score: number;
  fairnessIndex: number; signals: string[]; narrative: string;
}
export interface AiEthicsDashboard {
  generatedAt: string; headline: string; score: number;
  aiEthicsIndex: number; signals: string[]; narrative: string;
}
export interface HumanImpactDashboard {
  generatedAt: string; headline: string; score: number;
  humanImpactIndex: number; signals: string[]; narrative: string;
}
export interface GovernanceDashboard {
  generatedAt: string; headline: string; score: number;
  governanceIndex: number; signals: string[]; narrative: string;
}
export interface EthicalRiskDashboard {
  generatedAt: string; headline: string; score: number;
  riskScore: number; signals: string[]; narrative: string;
}
export interface EthicalOutlookDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: EthicalOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveEthicalBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: EthicalOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: EthicalLens; narrative: string;
}
export interface BoardEthicalReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: EthicalOutlook; valuesScore: number;
  fairnessScore: number; governanceScore: number; recommendations: string[];
  lenses: EthicalLens; narrative: string;
}
export interface EthicalHealthScore {
  overallScore: number; status: EthicalHealthStatus; outlook: EthicalOutlook;
  areaScores: Record<EthicalArea, number>; valuesScore: number;
  fairnessScore: number; humanImpactScore: number; governanceScore: number;
  forecastScore: number; scenarioScore: number; lenses: EthicalLens; narrative: string;
}
export interface EthicalReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: EthicalConfidenceScore; narrative: string;
}
export interface EthicalProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<EthicalArea, number>; outlook: EthicalOutlook;
  forecast: number; dashboard: EthicalDashboard; brief: ExecutiveEthicalBrief;
  overallConfidence: EthicalConfidenceScore;
}
export interface EthicalHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: EthicalArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: EthicalMetadata;
}
export interface EthicalPublisher { domain: string; capability: string; }
export interface EthicalQueryRequest {
  question: string;
  focus?: "general" | EthicalArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface EthicalQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: EthicalConfidenceScore;
}

export interface EthicalRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  culturalResult?: CulturalResultLight; behavioralResult?: BehavioralResultLight;
  legalComplianceRiskResult?: LegalComplianceRiskResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight; reputationResult?: ReputationResultLight;
  baselineOverrides?: Partial<EthicalBaseline>; metadata?: EthicalMetadata;
}

export interface EthicalResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: EthicalBaseline;
  healthScore: EthicalScore;
  ethicalDecisionAnalysisScore: EthicalScore;
  valuesAlignmentScore: EthicalScore;
  fairnessScore: EthicalScore;
  transparencyScore: EthicalScore;
  accountabilityScore: EthicalScore;
  humanImpactScore: EthicalScore;
  aiEthicsScore: EthicalScore;
  responsibleAutomationScore: EthicalScore;
  biasDiscriminationScore: EthicalScore;
  governanceEthicsScore: EthicalScore;
  privacyDataEthicsScore: EthicalScore;
  sustainabilityEthicsScore: EthicalScore;
  socialResponsibilityScore: EthicalScore;
  ethicalRiskScore: EthicalScore;
  ethicalOpportunityScore: EthicalScore;
  ethicalStewardshipScore: EthicalScore;
  recommendationValidationScore: EthicalScore;
  forecastScore: EthicalScore; scenarioScore: EthicalScore; analysisScore: EthicalScore;
  earlyWarningScore: EthicalScore;
  health: EthicalHealthScore; dashboard: EthicalDashboard;
  valuesAlignmentDashboard: ValuesAlignmentDashboard;
  fairnessDashboard: FairnessDashboard;
  aiEthicsDashboard: AiEthicsDashboard;
  humanImpactDashboard: HumanImpactDashboard;
  governanceDashboard: GovernanceDashboard;
  ethicalRiskDashboard: EthicalRiskDashboard;
  outlookDashboard: EthicalOutlookDashboard;
  brief: ExecutiveEthicalBrief; boardReport: BoardEthicalReport;
  recommendations: EthicalRecommendationRecord[]; risks: EthicalRiskRecord[];
  opportunities: EthicalOpportunityRecord[];
  areaSuites: Record<EthicalArea, EthicalAreaSuite>;
  trendSuite: EthicalTrendSuite; forecastSuite: EthicalForecastSuite;
  scenarioSuite: EthicalScenarioSuite; analysisSuite: EthicalAnalysisSuite;
  valuesAlignmentSuite: ValuesAlignmentSuite;
  fairnessSuite: FairnessSuite;
  humanImpactSuite: HumanImpactSuite;
  aiEthicsSuite: AiEthicsSuite;
  governanceEthicsSuite: GovernanceEthicsSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: EthicalKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: EthicalReasoningResult; projection: EthicalProjectionResult;
  historyRecord: EthicalHistoryRecord; confidence: EthicalConfidenceScore;
  requestMetadata: EthicalMetadata;
}