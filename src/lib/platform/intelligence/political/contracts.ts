import type * as T from "@/lib/platform/intelligence/political/types";

export interface PoliticalIntelligenceEngine { build(request: T.PoliticalRequest): T.PoliticalResult; }
export type PoliticalEngine = PoliticalIntelligenceEngine;
export interface PoliticalAreaIntelligence {
  assess(input: { baseline: T.PoliticalBaseline; now: Date; createId: (prefix: string) => string }): T.PoliticalAreaSuite;
}
export interface PoliticalForecastEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.PoliticalForecastSuite;
}
export interface PoliticalScenarioEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; forecasts: T.PoliticalForecastSuite; now: Date; createId: (prefix: string) => string }): T.PoliticalScenarioSuite;
}
export interface PoliticalTrendEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.PoliticalTrendSuite;
}
export interface PoliticalAnalysisEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; forecasts: T.PoliticalForecastSuite; scenarios: T.PoliticalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.PoliticalAnalysisSuite;
}
export interface LegislativeTrackingEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.LegislativeTrackingSuite;
}
export interface RegulatoryImpactEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.RegulatoryImpactSuite;
}
export interface PoliticalRiskEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.PoliticalRiskSuite;
}
export interface GovernmentFundingEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; areas: Record<T.PoliticalArea, T.PoliticalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.GovernmentFundingSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.PoliticalBaseline; trends: T.PoliticalTrendSuite; scenarios: T.PoliticalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface PoliticalReasonerContract {
  reason(input: { request: T.PoliticalRequest; trends: T.PoliticalTrendSuite; forecasts: T.PoliticalForecastSuite; scenarios: T.PoliticalScenarioSuite; confidence: T.PoliticalConfidenceScore }): T.PoliticalReasoningResult;
}
export interface PoliticalRepository {
  save(result: T.PoliticalResult): T.PoliticalResult;
  get(requestId: string): T.PoliticalResult | null;
  list(scope?: Partial<T.GraphScope>): T.PoliticalResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.PoliticalHistoryRecord): T.PoliticalHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.PoliticalHistoryRecord[];
  clear(): void;
}
export interface PoliticalRegistry {
  register(domain: string, capability: string): void;
  list(): T.PoliticalPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface PoliticalIntelligenceService {
  build(request: T.PoliticalRequest): T.PoliticalResult;
  query(result: T.PoliticalResult, request: T.PoliticalQueryRequest): T.PoliticalQueryResult;
  repository(): PoliticalRepository;
}
export type PoliticalService = PoliticalIntelligenceService;
export interface PoliticalDependencies {
  engine?: PoliticalIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.PoliticalArea, PoliticalAreaIntelligence>>;
  forecastEngine?: PoliticalForecastEngineContract;
  scenarioEngine?: PoliticalScenarioEngineContract;
  trendEngine?: PoliticalTrendEngineContract;
  analysisEngine?: PoliticalAnalysisEngineContract;
  legislativeTrackingEngine?: LegislativeTrackingEngineContract;
  regulatoryImpactEngine?: RegulatoryImpactEngineContract;
  politicalRiskEngine?: PoliticalRiskEngineContract;
  governmentFundingEngine?: GovernmentFundingEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: PoliticalReasonerContract;
  repository?: PoliticalRepository;
  registry?: PoliticalRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
