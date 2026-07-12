import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const IMPACT_INTELLIGENCE_VERSION = "0.1.0";
export const IMPACT_CAPABILITIES = [
  "mission_impact", "customer_impact", "employee_impact", "student_impact",
  "community_impact", "financial_impact", "grant_impact", "program_effectiveness",
  "strategic_goal_achievement", "operational_impact", "innovation_impact",
  "long_term_organizational_impact", "impact_measurement", "outcome_measurement",
  "roi_sroi_analysis", "recommendation_generation", "knowledge_contribution",
  "closed_learning_loop",
] as const;
export const INDICATOR_TYPES = ["leading", "lagging"] as const;
export const MEASUREMENT_KINDS = ["kpi", "okr", "outcome", "leading_indicator", "lagging_indicator", "benchmark", "baseline", "trend", "longitudinal", "forecasted"] as const;
export const IMPACT_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const IMPACT_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const IMPACT_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "achieved", "deferred"] as const;
export const IMPACT_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const IMPACT_AREAS = ["mission", "customer", "employee", "student", "community", "financial", "grant", "program_effectiveness", "strategic_goal_achievement", "operational", "innovation", "long_term_organizational"] as const;

export type ImpactCapability = typeof IMPACT_CAPABILITIES[number];
export type IndicatorType = typeof INDICATOR_TYPES[number];
export type MeasurementKind = typeof MEASUREMENT_KINDS[number];
export type ImpactHealthStatus = typeof IMPACT_HEALTH_STATUSES[number];
export type ImpactPriorityBand = typeof IMPACT_PRIORITY_BANDS[number];
export type ImpactArtifactStatus = typeof IMPACT_ARTIFACT_STATUSES[number];
export type ImpactConfidenceLevel = typeof IMPACT_CONFIDENCE_LEVELS[number];
export type ImpactArea = typeof IMPACT_AREAS[number];
export type ImpactMetadata = Record<string, unknown>;
export type { GraphScope };

export interface ImpactLens {
  outcomeAchieved: string;
  evidenceSupports: string;
  baselineUsed: string;
  whatChanged: string;
  confidenceLevel: string;
  causeAttribution: string;
  goalsImproved: string;
  nextImprovement: string;
}
export interface ImpactScore { key: string; label: string; value: number; status: ImpactHealthStatus; band: ImpactPriorityBand; narrative: string; }
export interface ImpactConfidenceScore { value: number; level: ImpactConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface InnovationResultLight extends ResultLightBase { innovationScore?: { value?: number }; }
export interface KnowledgeResultLight extends ResultLightBase { coverageScore?: { value?: number }; contributionScore?: { value?: number }; }
export interface DocumentResultLight extends ResultLightBase { complianceScore?: { value?: number }; }
export interface HumanCapitalResultLight extends ResultLightBase { workforceScore?: { value?: number }; }
export interface CustomerResultLight extends ResultLightBase { satisfactionScore?: { value?: number }; }
export interface RevenueResultLight extends ResultLightBase { revenueScore?: { value?: number }; }
export interface FundingResultLight extends ResultLightBase { fundingScore?: { value?: number }; }
export interface OperationsResultLight extends ResultLightBase { operationsScore?: { value?: number }; }
export interface ImprovementResultLight extends ResultLightBase { improvementScore?: { value?: number }; }
export interface MarketResultLight extends ResultLightBase { marketScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }

export interface ImpactBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<ImpactArea, number>;
  measurementMaturity: number;
  outcomeMaturity: number;
  roiMaturity: number;
  knowledgeMaturity: number;
  evidenceCoverage: number;
}
export interface ImpactAreaRecord { id: string; area: ImpactArea; title: string; score: number; status: ImpactArtifactStatus; outcome: string; evidence: string[]; lenses: ImpactLens; narrative: string; }
export interface ImpactAreaSuite { area: ImpactArea; records: ImpactAreaRecord[]; score: number; achievedCount: number; atRiskCount: number; narrative: string; }

export interface ImpactMeasurement {
  id: string; name: string; kind: MeasurementKind; indicatorType?: IndicatorType; area: ImpactArea;
  baseline: number; current: number; target: number; unit: string; trend: "improving" | "stable" | "declining";
  benchmark?: number; forecast?: number; history: number[]; narrative: string;
}
export interface ImpactMeasurementSuite { measurements: ImpactMeasurement[]; kindsCovered: MeasurementKind[]; leadingCount: number; laggingCount: number; maturityScore: number; narrative: string; }
export interface OutcomeRecord { id: string; title: string; area: ImpactArea; baseline: number; current: number; target: number; achieved: boolean; attribution: number; confidence: ImpactConfidenceLevel; lenses: ImpactLens; narrative: string; }
export interface OutcomeSuite { outcomes: OutcomeRecord[]; achievementScore: number; achievedCount: number; narrative: string; }
export interface RoiRecord { id: string; title: string; kind: "roi" | "sroi"; investment: number; valueCreated: number; ratio: number; confidence: ImpactConfidenceLevel; lenses: ImpactLens; narrative: string; }
export interface RoiSuite { analyses: RoiRecord[]; roi: number; sroi: number; valueCreated: number; narrative: string; }

export interface ImpactKnowledgeDraft { id: string; type: string; title: string; confidence: number; sourceRef: string; validated: boolean; metadata: ImpactMetadata; }
export interface ImpactKnowledgeContribution { artifacts: ImpactKnowledgeDraft[]; contributionScore: number; validatedCount: number; narrative: string; }
export interface ClosedLearningLoopContribution { id: string; destinations: Array<"knowledge" | "organizational-improvement" | "executive-decision" | "innovation">; lessons: string[]; improvementActions: string[]; decisionSignals: string[]; innovationSignals: string[]; contributedAt: string; narrative: string; }
export interface ImpactRecommendationRecord { id: string; title: string; priority: ImpactPriorityBand; evidenceRefs: string[]; confidenceScore: number; owner: string; dueDate: string; rationale: string; action: string; lenses: ImpactLens; narrative: string; }
export interface ImpactRiskRecord { id: string; title: string; area: ImpactArea; severity: ImpactPriorityBand; score: number; mitigation: string; lenses: ImpactLens; narrative: string; }
export interface ImpactOpportunityRecord { id: string; title: string; area: ImpactArea; priority: ImpactPriorityBand; score: number; lenses: ImpactLens; narrative: string; }

export interface ImpactDashboard { generatedAt: string; headline: string; overall: number; areaScores: Record<ImpactArea, number>; measurementScore: number; outcomeScore: number; roiScore: number; knowledgeScore: number; topRisks: string[]; topOpportunities: string[]; narrative: string; }
export interface MissionImpactDashboard { generatedAt: string; headline: string; score: number; outcomes: string[]; narrative: string; }
export interface OutcomeDashboard { generatedAt: string; headline: string; achievementScore: number; achievedCount: number; totalCount: number; narrative: string; }
export interface ProgramEffectivenessDashboard { generatedAt: string; headline: string; score: number; programs: string[]; narrative: string; }
export interface RoiDashboard { generatedAt: string; headline: string; roi: number; valueCreated: number; narrative: string; }
export interface SroiDashboard { generatedAt: string; headline: string; sroi: number; socialValueCreated: number; narrative: string; }
export interface ExecutiveImpactBrief { generatedAt: string; headline: string; summary: string; healthScore: number; topRecommendations: string[]; topRisks: string[]; lenses: ImpactLens; narrative: string; }
export interface BoardImpactReport { generatedAt: string; headline: string; assuranceSummary: string; healthScore: number; missionScore: number; outcomeScore: number; roi: number; recommendations: string[]; lenses: ImpactLens; narrative: string; }
export interface ImpactHealthScore { overallScore: number; status: ImpactHealthStatus; areaScores: Record<ImpactArea, number>; measurementScore: number; outcomeScore: number; roiScore: number; knowledgeScore: number; lenses: ImpactLens; narrative: string; }
export interface ImpactReasoningResult { answer: string; connectedOutcomes: string[]; evidenceGaps: string[]; confidence: ImpactConfidenceScore; narrative: string; }
export interface ImpactProjectionResult { generatedAt: string; headline: string; healthScore: number; areaScores: Record<ImpactArea, number>; measurementScore: number; outcomeScore: number; roiScore: number; forecast: number; dashboard: ImpactDashboard; brief: ExecutiveImpactBrief; overallConfidence: ImpactConfidenceScore; }
export interface ImpactHistoryRecord { id: string; requestId: string; scope: GraphScope; status: ImpactArtifactStatus; healthScore: number; generatedAt: string; summary: string; metadata: ImpactMetadata; }
export interface ImpactPublisher { domain: string; capability: string; }
export interface ImpactQueryRequest { question: string; focus?: "general" | ImpactArea | "measurement" | "outcomes" | "roi" | "recommendations" | "reasoning" | "learning"; maxResults?: number; }
export interface ImpactQueryResult { question: string; focus: string; answer: string; references: string[]; confidence: ImpactConfidenceScore; }

export interface ImpactRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  innovationResult?: InnovationResultLight; knowledgeResult?: KnowledgeResultLight; documentResult?: DocumentResultLight;
  humanCapitalResult?: HumanCapitalResultLight; customerResult?: CustomerResultLight; revenueResult?: RevenueResultLight;
  fundingResult?: FundingResultLight; operationsResult?: OperationsResultLight; improvementResult?: ImprovementResultLight;
  marketResult?: MarketResultLight; decisionResult?: DecisionResultLight; opportunityResult?: OpportunityResultLight;
  baselineOverrides?: Partial<ImpactBaseline>; metadata?: ImpactMetadata;
}
export interface ImpactResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string; scope: GraphScope; baseline: ImpactBaseline;
  healthScore: ImpactScore; missionScore: ImpactScore; customerScore: ImpactScore; employeeScore: ImpactScore; studentScore: ImpactScore;
  communityScore: ImpactScore; financialScore: ImpactScore; grantScore: ImpactScore; programEffectivenessScore: ImpactScore;
  strategicGoalAchievementScore: ImpactScore; operationalScore: ImpactScore; innovationScore: ImpactScore;
  longTermOrganizationalScore: ImpactScore; measurementScore: ImpactScore; outcomeScore: ImpactScore; roiScore: ImpactScore; knowledgeScore: ImpactScore;
  health: ImpactHealthScore; dashboard: ImpactDashboard; missionDashboard: MissionImpactDashboard; outcomeDashboard: OutcomeDashboard;
  programEffectivenessDashboard: ProgramEffectivenessDashboard; roiDashboard: RoiDashboard; sroiDashboard: SroiDashboard;
  brief: ExecutiveImpactBrief; boardReport: BoardImpactReport; recommendations: ImpactRecommendationRecord[]; risks: ImpactRiskRecord[];
  opportunities: ImpactOpportunityRecord[]; measurementSuite: ImpactMeasurementSuite; outcomeSuite: OutcomeSuite; roiSuite: RoiSuite;
  areaSuites: Record<ImpactArea, ImpactAreaSuite>; knowledgeContribution: ImpactKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution; reasoning: ImpactReasoningResult; projection: ImpactProjectionResult;
  historyRecord: ImpactHistoryRecord; confidence: ImpactConfidenceScore; requestMetadata: ImpactMetadata;
}
