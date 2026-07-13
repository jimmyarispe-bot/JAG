import type * as T from "@/lib/platform/intelligence/resilience/types";

export interface ResilienceIntelligenceEngine { build(request: T.ResilienceRequest): T.ResilienceResult; }
export type ResilienceEngine = ResilienceIntelligenceEngine;
export interface ResilienceAreaIntelligence {
  assess(input: { baseline: T.ResilienceBaseline; now: Date; createId: (prefix: string) => string }): T.ResilienceAreaSuite;
}
export interface ResilienceForecastEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ResilienceForecastSuite;
}
export interface ResilienceScenarioEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; forecasts: T.ResilienceForecastSuite; now: Date; createId: (prefix: string) => string }): T.ResilienceScenarioSuite;
}
export interface ResilienceTrendEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ResilienceTrendSuite;
}
export interface ResilienceAnalysisEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; forecasts: T.ResilienceForecastSuite; scenarios: T.ResilienceScenarioSuite; now: Date; createId: (prefix: string) => string }): T.ResilienceAnalysisSuite;
}
export interface StressTestEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.StressTestSuite;
}
export interface RecoveryEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.RecoverySuite;
}
export interface ContinuityEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ContinuitySuite;
}
export interface AdaptiveCapacityEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.AdaptiveCapacitySuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; trends: T.ResilienceTrendSuite; scenarios: T.ResilienceScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface ResilienceReasonerContract {
  reason(input: { request: T.ResilienceRequest; trends: T.ResilienceTrendSuite; forecasts: T.ResilienceForecastSuite; scenarios: T.ResilienceScenarioSuite; confidence: T.ResilienceConfidenceScore }): T.ResilienceReasoningResult;
}
export interface ResilienceRepository {
  save(result: T.ResilienceResult): T.ResilienceResult;
  get(requestId: string): T.ResilienceResult | null;
  list(scope?: Partial<T.GraphScope>): T.ResilienceResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.ResilienceHistoryRecord): T.ResilienceHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.ResilienceHistoryRecord[];
  clear(): void;
}
export interface ResilienceRegistry {
  register(domain: string, capability: string): void;
  list(): T.ResiliencePublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface ResilienceIntelligenceService {
  build(request: T.ResilienceRequest): T.ResilienceResult;
  query(result: T.ResilienceResult, request: T.ResilienceQueryRequest): T.ResilienceQueryResult;
  repository(): ResilienceRepository;
}
export type ResilienceService = ResilienceIntelligenceService;
export interface ResilienceDependencies {
  engine?: ResilienceIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.ResilienceArea, ResilienceAreaIntelligence>>;
  forecastEngine?: ResilienceForecastEngineContract;
  scenarioEngine?: ResilienceScenarioEngineContract;
  trendEngine?: ResilienceTrendEngineContract;
  analysisEngine?: ResilienceAnalysisEngineContract;
  stressTestEngine?: StressTestEngineContract;
  recoveryEngine?: RecoveryEngineContract;
  continuityEngine?: ContinuityEngineContract;
  adaptiveCapacityEngine?: AdaptiveCapacityEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: ResilienceReasonerContract;
  repository?: ResilienceRepository;
  registry?: ResilienceRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
