import type * as T from "@/lib/platform/intelligence/economic/types";

export interface EconomicIntelligenceEngine { build(request: T.EconomicRequest): T.EconomicResult; }
export type EconomicEngine = EconomicIntelligenceEngine;
export interface EconomicAreaIntelligence {
  assess(input: { baseline: T.EconomicBaseline; now: Date; createId: (prefix: string) => string }): T.EconomicAreaSuite;
}
export interface EconomicForecastEngineContract {
  assess(input: { baseline: T.EconomicBaseline; areas: Record<T.EconomicArea, T.EconomicAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EconomicForecastSuite;
}
export interface EconomicScenarioEngineContract {
  assess(input: { baseline: T.EconomicBaseline; areas: Record<T.EconomicArea, T.EconomicAreaSuite>; forecasts: T.EconomicForecastSuite; now: Date; createId: (prefix: string) => string }): T.EconomicScenarioSuite;
}
export interface EconomicTrendEngineContract {
  assess(input: { baseline: T.EconomicBaseline; areas: Record<T.EconomicArea, T.EconomicAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EconomicTrendSuite;
}
export interface EconomicAnalysisEngineContract {
  assess(input: { baseline: T.EconomicBaseline; areas: Record<T.EconomicArea, T.EconomicAreaSuite>; forecasts: T.EconomicForecastSuite; scenarios: T.EconomicScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EconomicAnalysisSuite;
}
export interface EconomicReasonerContract {
  reason(input: { request: T.EconomicRequest; trends: T.EconomicTrendSuite; forecasts: T.EconomicForecastSuite; scenarios: T.EconomicScenarioSuite; confidence: T.EconomicConfidenceScore }): T.EconomicReasoningResult;
}
export interface EconomicRepository {
  save(result: T.EconomicResult): T.EconomicResult;
  get(requestId: string): T.EconomicResult | null;
  list(scope?: Partial<T.GraphScope>): T.EconomicResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.EconomicHistoryRecord): T.EconomicHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.EconomicHistoryRecord[];
  clear(): void;
}
export interface EconomicRegistry {
  register(domain: string, capability: string): void;
  list(): T.EconomicPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface EconomicIntelligenceService {
  build(request: T.EconomicRequest): T.EconomicResult;
  query(result: T.EconomicResult, request: T.EconomicQueryRequest): T.EconomicQueryResult;
  repository(): EconomicRepository;
}
export type EconomicService = EconomicIntelligenceService;
export interface EconomicDependencies {
  engine?: EconomicIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.EconomicArea, EconomicAreaIntelligence>>;
  forecastEngine?: EconomicForecastEngineContract;
  scenarioEngine?: EconomicScenarioEngineContract;
  trendEngine?: EconomicTrendEngineContract;
  analysisEngine?: EconomicAnalysisEngineContract;
  reasoner?: EconomicReasonerContract;
  repository?: EconomicRepository;
  registry?: EconomicRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
