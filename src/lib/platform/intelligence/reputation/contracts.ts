import type * as T from "@/lib/platform/intelligence/reputation/types";

export interface ReputationIntelligenceEngine { build(request: T.ReputationRequest): T.ReputationResult; }
export type ReputationEngine = ReputationIntelligenceEngine;
export interface ReputationAreaIntelligence {
  assess(input: { baseline: T.ReputationBaseline; now: Date; createId: (prefix: string) => string }): T.ReputationAreaSuite;
}
export interface ReputationForecastEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ReputationForecastSuite;
}
export interface ReputationScenarioEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; forecasts: T.ReputationForecastSuite; now: Date; createId: (prefix: string) => string }): T.ReputationScenarioSuite;
}
export interface ReputationTrendEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ReputationTrendSuite;
}
export interface ReputationAnalysisEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; forecasts: T.ReputationForecastSuite; scenarios: T.ReputationScenarioSuite; now: Date; createId: (prefix: string) => string }): T.ReputationAnalysisSuite;
}
export interface TrustEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; now: Date; createId: (prefix: string) => string }): T.TrustSuite;
}
export interface SentimentEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SentimentSuite;
}
export interface NarrativeAnalysisEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; now: Date; createId: (prefix: string) => string }): T.NarrativeAnalysisSuite;
}
export interface MediaIntelligenceEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; now: Date; createId: (prefix: string) => string }): T.MediaIntelligenceSuite;
}
export interface CrisisDetectionEngineContract {
  assess(input: { baseline: T.ReputationBaseline; areas: Record<T.ReputationArea, T.ReputationAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CrisisDetectionSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.ReputationBaseline; trends: T.ReputationTrendSuite; scenarios: T.ReputationScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface ReputationReasonerContract {
  reason(input: { request: T.ReputationRequest; trends: T.ReputationTrendSuite; forecasts: T.ReputationForecastSuite; scenarios: T.ReputationScenarioSuite; confidence: T.ReputationConfidenceScore }): T.ReputationReasoningResult;
}
export interface ReputationRepository {
  save(result: T.ReputationResult): T.ReputationResult;
  get(requestId: string): T.ReputationResult | null;
  list(scope?: Partial<T.GraphScope>): T.ReputationResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.ReputationHistoryRecord): T.ReputationHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.ReputationHistoryRecord[];
  clear(): void;
}
export interface ReputationRegistry {
  register(domain: string, capability: string): void;
  list(): T.ReputationPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface ReputationIntelligenceService {
  build(request: T.ReputationRequest): T.ReputationResult;
  query(result: T.ReputationResult, request: T.ReputationQueryRequest): T.ReputationQueryResult;
  repository(): ReputationRepository;
}
export type ReputationService = ReputationIntelligenceService;
export interface ReputationDependencies {
  engine?: ReputationIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.ReputationArea, ReputationAreaIntelligence>>;
  forecastEngine?: ReputationForecastEngineContract;
  scenarioEngine?: ReputationScenarioEngineContract;
  trendEngine?: ReputationTrendEngineContract;
  analysisEngine?: ReputationAnalysisEngineContract;
  trustEngine?: TrustEngineContract;
  sentimentEngine?: SentimentEngineContract;
  narrativeAnalysisEngine?: NarrativeAnalysisEngineContract;
  mediaIntelligenceEngine?: MediaIntelligenceEngineContract;
  crisisDetectionEngine?: CrisisDetectionEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: ReputationReasonerContract;
  repository?: ReputationRepository;
  registry?: ReputationRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
