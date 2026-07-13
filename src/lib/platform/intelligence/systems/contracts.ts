import type * as T from "@/lib/platform/intelligence/systems/types";

export interface SystemsIntelligenceEngine { build(request: T.SystemsRequest): T.SystemsResult; }
export type SystemsEngine = SystemsIntelligenceEngine;
export interface SystemsAreaIntelligence {
  assess(input: { baseline: T.SystemsBaseline; now: Date; createId: (prefix: string) => string }): T.SystemsAreaSuite;
}
export interface SystemsForecastEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SystemsForecastSuite;
}
export interface SystemsScenarioEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; forecasts: T.SystemsForecastSuite; now: Date; createId: (prefix: string) => string }): T.SystemsScenarioSuite;
}
export interface SystemsTrendEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SystemsTrendSuite;
}
export interface SystemsAnalysisEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; forecasts: T.SystemsForecastSuite; scenarios: T.SystemsScenarioSuite; now: Date; createId: (prefix: string) => string }): T.SystemsAnalysisSuite;
}
export interface DependencyEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DependencySuite;
}
export interface FeedbackLoopEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.FeedbackLoopSuite;
}
export interface ConstraintEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConstraintSuite;
}
export interface BottleneckEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.BottleneckSuite;
}
export interface NetworkDynamicsEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.NetworkDynamicsSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.SystemsBaseline; trends: T.SystemsTrendSuite; scenarios: T.SystemsScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface SystemsReasonerContract {
  reason(input: { request: T.SystemsRequest; trends: T.SystemsTrendSuite; forecasts: T.SystemsForecastSuite; scenarios: T.SystemsScenarioSuite; confidence: T.SystemsConfidenceScore }): T.SystemsReasoningResult;
}
export interface SystemsRepository {
  save(result: T.SystemsResult): T.SystemsResult;
  get(requestId: string): T.SystemsResult | null;
  list(scope?: Partial<T.GraphScope>): T.SystemsResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.SystemsHistoryRecord): T.SystemsHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.SystemsHistoryRecord[];
  clear(): void;
}
export interface SystemsRegistry {
  register(domain: string, capability: string): void;
  list(): T.SystemsPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface SystemsIntelligenceService {
  build(request: T.SystemsRequest): T.SystemsResult;
  query(result: T.SystemsResult, request: T.SystemsQueryRequest): T.SystemsQueryResult;
  repository(): SystemsRepository;
}
export type SystemsService = SystemsIntelligenceService;
export interface SystemsDependencies {
  engine?: SystemsIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.SystemsArea, SystemsAreaIntelligence>>;
  forecastEngine?: SystemsForecastEngineContract;
  scenarioEngine?: SystemsScenarioEngineContract;
  trendEngine?: SystemsTrendEngineContract;
  analysisEngine?: SystemsAnalysisEngineContract;
  dependencyEngine?: DependencyEngineContract;
  feedbackLoopEngine?: FeedbackLoopEngineContract;
  constraintEngine?: ConstraintEngineContract;
  bottleneckEngine?: BottleneckEngineContract;
  networkDynamicsEngine?: NetworkDynamicsEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: SystemsReasonerContract;
  repository?: SystemsRepository;
  registry?: SystemsRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
