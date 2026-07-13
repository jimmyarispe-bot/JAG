import type * as T from "@/lib/platform/intelligence/behavioral/types";

export interface BehavioralIntelligenceEngine { build(request: T.BehavioralRequest): T.BehavioralResult; }
export type BehavioralEngine = BehavioralIntelligenceEngine;
export interface BehavioralAreaIntelligence {
  assess(input: { baseline: T.BehavioralBaseline; now: Date; createId: (prefix: string) => string }): T.BehavioralAreaSuite;
}
export interface BehavioralForecastEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; now: Date; createId: (prefix: string) => string }): T.BehavioralForecastSuite;
}
export interface BehavioralScenarioEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; forecasts: T.BehavioralForecastSuite; now: Date; createId: (prefix: string) => string }): T.BehavioralScenarioSuite;
}
export interface BehavioralTrendEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; now: Date; createId: (prefix: string) => string }): T.BehavioralTrendSuite;
}
export interface BehavioralAnalysisEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; forecasts: T.BehavioralForecastSuite; scenarios: T.BehavioralScenarioSuite; now: Date; createId: (prefix: string) => string }): T.BehavioralAnalysisSuite;
}
export interface DecisionModelingEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DecisionModelingSuite;
}
export interface CognitiveBiasEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CognitiveBiasSuite;
}
export interface MotivationEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; now: Date; createId: (prefix: string) => string }): T.MotivationSuite;
}
export interface CollaborationEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollaborationSuite;
}
export interface ChangeAdoptionEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; areas: Record<T.BehavioralArea, T.BehavioralAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ChangeAdoptionSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.BehavioralBaseline; trends: T.BehavioralTrendSuite; scenarios: T.BehavioralScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface BehavioralReasonerContract {
  reason(input: { request: T.BehavioralRequest; trends: T.BehavioralTrendSuite; forecasts: T.BehavioralForecastSuite; scenarios: T.BehavioralScenarioSuite; confidence: T.BehavioralConfidenceScore }): T.BehavioralReasoningResult;
}
export interface BehavioralRepository {
  save(result: T.BehavioralResult): T.BehavioralResult;
  get(requestId: string): T.BehavioralResult | null;
  list(scope?: Partial<T.GraphScope>): T.BehavioralResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.BehavioralHistoryRecord): T.BehavioralHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.BehavioralHistoryRecord[];
  clear(): void;
}
export interface BehavioralRegistry {
  register(domain: string, capability: string): void;
  list(): T.BehavioralPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface BehavioralIntelligenceService {
  build(request: T.BehavioralRequest): T.BehavioralResult;
  query(result: T.BehavioralResult, request: T.BehavioralQueryRequest): T.BehavioralQueryResult;
  repository(): BehavioralRepository;
}
export type BehavioralService = BehavioralIntelligenceService;
export interface BehavioralDependencies {
  engine?: BehavioralIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.BehavioralArea, BehavioralAreaIntelligence>>;
  forecastEngine?: BehavioralForecastEngineContract;
  scenarioEngine?: BehavioralScenarioEngineContract;
  trendEngine?: BehavioralTrendEngineContract;
  analysisEngine?: BehavioralAnalysisEngineContract;
  decisionModelingEngine?: DecisionModelingEngineContract;
  cognitiveBiasEngine?: CognitiveBiasEngineContract;
  motivationEngine?: MotivationEngineContract;
  collaborationEngine?: CollaborationEngineContract;
  changeAdoptionEngine?: ChangeAdoptionEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: BehavioralReasonerContract;
  repository?: BehavioralRepository;
  registry?: BehavioralRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
