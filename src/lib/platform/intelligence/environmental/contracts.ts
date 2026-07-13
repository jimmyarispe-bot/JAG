import type * as T from "@/lib/platform/intelligence/environmental/types";

export interface EnvironmentalIntelligenceEngine { build(request: T.EnvironmentalRequest): T.EnvironmentalResult; }
export type EnvironmentalEngine = EnvironmentalIntelligenceEngine;
export interface EnvironmentalAreaIntelligence {
  assess(input: { baseline: T.EnvironmentalBaseline; now: Date; createId: (prefix: string) => string }): T.EnvironmentalAreaSuite;
}
export interface EnvironmentalForecastEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EnvironmentalForecastSuite;
}
export interface EnvironmentalScenarioEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; forecasts: T.EnvironmentalForecastSuite; now: Date; createId: (prefix: string) => string }): T.EnvironmentalScenarioSuite;
}
export interface EnvironmentalTrendEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EnvironmentalTrendSuite;
}
export interface EnvironmentalAnalysisEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; forecasts: T.EnvironmentalForecastSuite; scenarios: T.EnvironmentalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EnvironmentalAnalysisSuite;
}
export interface ClimateRiskEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ClimateRiskSuite;
}
export interface DisasterImpactEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DisasterImpactSuite;
}
export interface SustainabilityEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SustainabilitySuite;
}
export interface InfrastructureResilienceEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; areas: Record<T.EnvironmentalArea, T.EnvironmentalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.InfrastructureResilienceSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.EnvironmentalBaseline; trends: T.EnvironmentalTrendSuite; scenarios: T.EnvironmentalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface EnvironmentalReasonerContract {
  reason(input: { request: T.EnvironmentalRequest; trends: T.EnvironmentalTrendSuite; forecasts: T.EnvironmentalForecastSuite; scenarios: T.EnvironmentalScenarioSuite; confidence: T.EnvironmentalConfidenceScore }): T.EnvironmentalReasoningResult;
}
export interface EnvironmentalRepository {
  save(result: T.EnvironmentalResult): T.EnvironmentalResult;
  get(requestId: string): T.EnvironmentalResult | null;
  list(scope?: Partial<T.GraphScope>): T.EnvironmentalResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.EnvironmentalHistoryRecord): T.EnvironmentalHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.EnvironmentalHistoryRecord[];
  clear(): void;
}
export interface EnvironmentalRegistry {
  register(domain: string, capability: string): void;
  list(): T.EnvironmentalPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface EnvironmentalIntelligenceService {
  build(request: T.EnvironmentalRequest): T.EnvironmentalResult;
  query(result: T.EnvironmentalResult, request: T.EnvironmentalQueryRequest): T.EnvironmentalQueryResult;
  repository(): EnvironmentalRepository;
}
export type EnvironmentalService = EnvironmentalIntelligenceService;
export interface EnvironmentalDependencies {
  engine?: EnvironmentalIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.EnvironmentalArea, EnvironmentalAreaIntelligence>>;
  forecastEngine?: EnvironmentalForecastEngineContract;
  scenarioEngine?: EnvironmentalScenarioEngineContract;
  trendEngine?: EnvironmentalTrendEngineContract;
  analysisEngine?: EnvironmentalAnalysisEngineContract;
  climateRiskEngine?: ClimateRiskEngineContract;
  disasterImpactEngine?: DisasterImpactEngineContract;
  sustainabilityEngine?: SustainabilityEngineContract;
  infrastructureResilienceEngine?: InfrastructureResilienceEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: EnvironmentalReasonerContract;
  repository?: EnvironmentalRepository;
  registry?: EnvironmentalRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
