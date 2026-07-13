import type * as T from "@/lib/platform/intelligence/wisdom/types";

export interface WisdomIntelligenceEngine { build(request: T.WisdomRequest): T.WisdomResult; }
export type WisdomEngine = WisdomIntelligenceEngine;
export interface WisdomAreaIntelligence {
  assess(input: { baseline: T.WisdomBaseline; now: Date; createId: (prefix: string) => string }): T.WisdomAreaSuite;
}
export interface WisdomForecastEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.WisdomForecastSuite;
}
export interface WisdomScenarioEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; forecasts: T.WisdomForecastSuite; now: Date; createId: (prefix: string) => string }): T.WisdomScenarioSuite;
}
export interface WisdomTrendEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.WisdomTrendSuite;
}
export interface WisdomAnalysisEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; forecasts: T.WisdomForecastSuite; scenarios: T.WisdomScenarioSuite; now: Date; createId: (prefix: string) => string }): T.WisdomAnalysisSuite;
}
export interface StrategicReasoningEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.StrategicReasoningSuite;
}
export interface CrossDomainSynthesisEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CrossDomainSynthesisSuite;
}
export interface TradeOffEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.TradeOffSuite;
}
export interface UncertaintyEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.UncertaintySuite;
}
export interface ExecutiveJudgmentEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ExecutiveJudgmentSuite;
}
export interface ConfidenceEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConfidenceSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.WisdomBaseline; trends: T.WisdomTrendSuite; scenarios: T.WisdomScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface WisdomReasonerContract {
  reason(input: { request: T.WisdomRequest; trends: T.WisdomTrendSuite; forecasts: T.WisdomForecastSuite; scenarios: T.WisdomScenarioSuite; confidence: T.WisdomConfidenceScore }): T.WisdomReasoningResult;
}
export interface WisdomRepository {
  save(result: T.WisdomResult): T.WisdomResult;
  get(requestId: string): T.WisdomResult | null;
  list(scope?: Partial<T.GraphScope>): T.WisdomResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.WisdomHistoryRecord): T.WisdomHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.WisdomHistoryRecord[];
  clear(): void;
}
export interface WisdomRegistry {
  register(domain: string, capability: string): void;
  list(): T.WisdomPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface WisdomIntelligenceService {
  build(request: T.WisdomRequest): T.WisdomResult;
  query(result: T.WisdomResult, request: T.WisdomQueryRequest): T.WisdomQueryResult;
  repository(): WisdomRepository;
}
export type WisdomService = WisdomIntelligenceService;
export interface WisdomDependencies {
  engine?: WisdomIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.WisdomArea, WisdomAreaIntelligence>>;
  forecastEngine?: WisdomForecastEngineContract;
  scenarioEngine?: WisdomScenarioEngineContract;
  trendEngine?: WisdomTrendEngineContract;
  analysisEngine?: WisdomAnalysisEngineContract;
  strategicReasoningEngine?: StrategicReasoningEngineContract;
  crossDomainSynthesisEngine?: CrossDomainSynthesisEngineContract;
  tradeOffEngine?: TradeOffEngineContract;
  uncertaintyEngine?: UncertaintyEngineContract;
  executiveJudgmentEngine?: ExecutiveJudgmentEngineContract;
  confidenceEngine?: ConfidenceEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: WisdomReasonerContract;
  repository?: WisdomRepository;
  registry?: WisdomRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
