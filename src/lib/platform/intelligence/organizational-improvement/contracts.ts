/** Organizational Improvement Engine contracts (Sprint 036). Leaf module: implementation-free. */
import type * as T from "@/lib/platform/intelligence/organizational-improvement/types";

export interface OrganizationalImprovementEngine {
  build(request: T.ImprovementRequest): T.ImprovementResult;
}
export type ImprovementEngine = OrganizationalImprovementEngine;

/** Legacy public Improvement* names; package is organizational-improvement. */
export interface ImprovementIntelligenceService {
  build(request: T.ImprovementRequest): T.ImprovementResult;
  query(result: T.ImprovementResult, request: T.ImprovementQueryRequest): T.ImprovementQueryResult;
  repository(): ImprovementRepository;
}
export type ImprovementService = ImprovementIntelligenceService;

/** Legacy public Improvement* names; package is organizational-improvement. */
export interface ImprovementRepository {
  save(result: T.ImprovementResult): T.ImprovementResult;
  get(requestId: string): T.ImprovementResult | null;
  list(scope?: Partial<T.GraphScope>): T.ImprovementResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.ImprovementHistoryRecord): T.ImprovementHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.ImprovementHistoryRecord[];
  clear(): void;
}

export type BaselineInput = { baseline: T.ImprovementBaseline; now: Date };

export interface SourceAnalyzer {
  analyze(input: BaselineInput & {
    request: T.ImprovementRequest;
    createId: (prefix: string) => string;
  }): T.ImprovementRecord[];
}

export type OrganizationHealthSource = SourceAnalyzer;
export type ExecutiveGraphSource = SourceAnalyzer;
export type ExecutiveDecisionSource = SourceAnalyzer;
export type PredictiveSource = SourceAnalyzer;
export type HumanCapitalSource = SourceAnalyzer;
export type RevenueSource = SourceAnalyzer;
export type FundingSource = SourceAnalyzer;
export type OpportunitySource = SourceAnalyzer;
export type BoardGovernanceSource = SourceAnalyzer;
export type FutureDomainsSource = SourceAnalyzer;

export interface ImprovementSourceEngine {
  discover(input: BaselineInput & {
    request: T.ImprovementRequest;
    createId: (prefix: string) => string;
  }): Record<T.ImprovementSourceDomain, T.ImprovementRecord[]>;
}

export interface PriorityScoring {
  score(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["priority"];
}
export interface ImpactScoring {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["impact"];
}
export interface MissionAlignmentAnalysis {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["missionAlignment"];
}
export interface FinancialImpactAnalysis {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["financialImpact"];
}
export interface RiskReductionAnalysis {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["riskReduction"];
}
export interface TimeToValueAnalysis {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["timeToValue"];
}
export interface ResourceRequirementsAnalysis {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["resources"];
}
export interface OrganizationalCapacityAnalysis {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["capacity"];
}
export interface DependencyResolution {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["dependencies"];
}
export interface ImprovementConfidenceAnalysis {
  score(input: BaselineInput & { records: T.ImprovementRecord[] }): T.ImprovementAnalysisResult["confidence"];
}
export interface ImprovementAnalysisEngine {
  analyze(input: BaselineInput & { records: T.ImprovementRecord[]; dnaAlignment?: T.ImprovementDnaAlignment }): T.ImprovementAnalysisResult;
}

export interface QuickWinsPlanner {
  plan(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanResult;
}
export interface StrategicInitiativesPlanner {
  plan(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanResult;
}
export interface LongTermTransformationPlanner {
  plan(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanResult;
}
export interface WeeklyPlanComposer {
  plan(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanResult;
}
export interface MonthlyPlanComposer {
  plan(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanResult;
}
export interface QuarterlyPlanComposer {
  plan(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanResult;
}
export interface AnnualRoadmapComposer {
  plan(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanResult;
}
export interface ImprovementPlanner {
  planAll(input: { records: T.ImprovementRecord[] }): T.ImprovementPlanningSuite;
}

export interface ImprovementRegistry {
  register(domain: T.ImprovementSourceDomain, capability: string): void;
  list(): Array<{ domain: T.ImprovementSourceDomain; capability: string }>;
  isRegistered(domain: T.ImprovementSourceDomain): boolean;
  clear(): void;
}

export interface ImprovementIntelligence {
  composeScores(input: {
    baseline: T.ImprovementBaseline;
    improvements: T.ImprovementRecord[];
    analysis: T.ImprovementAnalysisResult;
  }): { healthScore: T.ImprovementScore; improvementScore: T.ImprovementScore; riskScore: T.ImprovementScore };
}
export interface ImprovementHealth {
  assess(input: {
    baseline: T.ImprovementBaseline;
    scores: { healthScore: T.ImprovementScore; improvementScore: T.ImprovementScore; riskScore: T.ImprovementScore };
    improvements: T.ImprovementRecord[];
    loop: T.ContinuousImprovementLoopResult;
  }): T.ImprovementHealthResult;
}
export interface ImprovementDashboard {
  compose(input: {
    baseline: T.ImprovementBaseline;
    scores: { healthScore: T.ImprovementScore; improvementScore: T.ImprovementScore; riskScore: T.ImprovementScore };
    improvements: T.ImprovementRecord[];
    planning: T.ImprovementPlanningSuite;
    now: Date;
  }): T.ImprovementDashboardResult;
}
export interface MissionImprovementDashboard {
  build(input: { improvements: T.ImprovementRecord[]; now: Date }): T.MissionImprovementDashboardResult;
}
export interface FinancialImprovementDashboard {
  build(input: { improvements: T.ImprovementRecord[]; now: Date }): T.FinancialImprovementDashboardResult;
}
export interface PeopleImprovementDashboard {
  build(input: { improvements: T.ImprovementRecord[]; now: Date }): T.PeopleImprovementDashboardResult;
}
export interface TodaysPrioritiesComposer {
  compose(input: { improvements: T.ImprovementRecord[]; now: Date }): T.TodaysPrioritiesResult;
}
export interface ImprovementHeatMap {
  compose(input: { improvements: T.ImprovementRecord[]; now: Date }): T.ImprovementHeatMapResult;
}
export interface ContinuousImprovementLoop {
  run(input: {
    improvements: T.ImprovementRecord[];
    analysis: T.ImprovementAnalysisResult;
    planning: T.ImprovementPlanningSuite;
    createId: (prefix: string) => string;
  }): T.ContinuousImprovementLoopResult;
}
export interface DailyExecutiveBriefGenerator {
  generate(input: {
    request: T.ImprovementRequest;
    improvements: T.ImprovementRecord[];
    confidence: T.ImprovementConfidenceScore;
    now: Date;
    createId: (prefix: string) => string;
  }): T.DailyExecutiveBrief;
}
export interface ExecutiveImprovementBriefGenerator {
  generate(input: {
    request: T.ImprovementRequest;
    baseline: T.ImprovementBaseline;
    scores: { healthScore: T.ImprovementScore; improvementScore: T.ImprovementScore; riskScore: T.ImprovementScore };
    improvements: T.ImprovementRecord[];
    planning: T.ImprovementPlanningSuite;
    analysis: T.ImprovementAnalysisResult;
    confidence: T.ImprovementConfidenceScore;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ExecutiveImprovementBrief;
}
export interface ImprovementProjection {
  project(input: {
    baseline: T.ImprovementBaseline;
    scores: { healthScore: T.ImprovementScore; improvementScore: T.ImprovementScore; riskScore: T.ImprovementScore };
    todaysPriorities: T.TodaysPrioritiesResult;
    weeklyPlan: T.ImprovementPlanResult;
    quarterlyRoadmap: T.ImprovementPlanResult;
    brief: T.ExecutiveImprovementBrief;
    dailyBrief: T.DailyExecutiveBrief;
    dashboard: T.ImprovementDashboardResult;
    confidence: T.ImprovementConfidenceScore;
  }): T.ImprovementProjectionResult;
}
export interface ImprovementQueries {
  ask(result: T.ImprovementResult, request: T.ImprovementQueryRequest): T.ImprovementQueryResult;
}

export interface ImprovementDependencies {
  engine?: OrganizationalImprovementEngine;
  repository?: ImprovementRepository;
  queries?: ImprovementQueries;
  improvementIntelligence?: ImprovementIntelligence;
  improvementHealth?: ImprovementHealth;
  improvementDashboard?: ImprovementDashboard;
  missionDashboard?: MissionImprovementDashboard;
  financialDashboard?: FinancialImprovementDashboard;
  peopleDashboard?: PeopleImprovementDashboard;
  todaysPriorities?: TodaysPrioritiesComposer;
  heatMap?: ImprovementHeatMap;
  loop?: ContinuousImprovementLoop;
  dailyBriefGenerator?: DailyExecutiveBriefGenerator;
  briefGenerator?: ExecutiveImprovementBriefGenerator;
  projection?: ImprovementProjection;
  sourceEngine?: ImprovementSourceEngine;
  analysisEngine?: ImprovementAnalysisEngine;
  planner?: ImprovementPlanner;
  registry?: ImprovementRegistry;
  organizationHealthSource?: OrganizationHealthSource;
  executiveGraphSource?: ExecutiveGraphSource;
  executiveDecisionSource?: ExecutiveDecisionSource;
  predictiveSource?: PredictiveSource;
  humanCapitalSource?: HumanCapitalSource;
  revenueSource?: RevenueSource;
  fundingSource?: FundingSource;
  opportunitySource?: OpportunitySource;
  boardGovernanceSource?: BoardGovernanceSource;
  futureDomainsSource?: FutureDomainsSource;
  priorityScoring?: PriorityScoring;
  impactScoring?: ImpactScoring;
  missionAlignment?: MissionAlignmentAnalysis;
  financialImpact?: FinancialImpactAnalysis;
  riskReduction?: RiskReductionAnalysis;
  timeToValue?: TimeToValueAnalysis;
  resourceRequirements?: ResourceRequirementsAnalysis;
  organizationalCapacity?: OrganizationalCapacityAnalysis;
  dependencyResolution?: DependencyResolution;
  improvementConfidence?: ImprovementConfidenceAnalysis;
  quickWinsPlanner?: QuickWinsPlanner;
  strategicInitiatives?: StrategicInitiativesPlanner;
  longTermTransformation?: LongTermTransformationPlanner;
  weeklyPlan?: WeeklyPlanComposer;
  monthlyPlan?: MonthlyPlanComposer;
  quarterlyPlan?: QuarterlyPlanComposer;
  annualRoadmap?: AnnualRoadmapComposer;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
