import type * as T from "@/lib/platform/intelligence/ecosystem/types";

export interface EcosystemIntelligenceEngine { build(request: T.EcosystemRequest): T.EcosystemResult; }
export type EcosystemEngine = EcosystemIntelligenceEngine;
export interface EcosystemAreaIntelligence {
  assess(input: { baseline: T.EcosystemBaseline; now: Date; createId: (prefix: string) => string }): T.EcosystemAreaSuite;
}
export interface EcosystemForecastEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EcosystemForecastSuite;
}
export interface EcosystemScenarioEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; forecasts: T.EcosystemForecastSuite; now: Date; createId: (prefix: string) => string }): T.EcosystemScenarioSuite;
}
export interface EcosystemTrendEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EcosystemTrendSuite;
}
export interface EcosystemAnalysisEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; forecasts: T.EcosystemForecastSuite; scenarios: T.EcosystemScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EcosystemAnalysisSuite;
}
export interface NetworkMappingEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.NetworkMappingSuite;
}
export interface PartnershipEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.PartnershipSuite;
}
export interface DependencyEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DependencySuite;
}
export interface CollaborationEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollaborationSuite;
}
export interface NetworkEffectEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.NetworkEffectSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; trends: T.EcosystemTrendSuite; scenarios: T.EcosystemScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface EcosystemReasonerContract {
  reason(input: { request: T.EcosystemRequest; trends: T.EcosystemTrendSuite; forecasts: T.EcosystemForecastSuite; scenarios: T.EcosystemScenarioSuite; confidence: T.EcosystemConfidenceScore }): T.EcosystemReasoningResult;
}
export interface EcosystemRepository {
  save(result: T.EcosystemResult): T.EcosystemResult;
  get(requestId: string): T.EcosystemResult | null;
  list(scope?: Partial<T.GraphScope>): T.EcosystemResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.EcosystemHistoryRecord): T.EcosystemHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.EcosystemHistoryRecord[];
  clear(): void;
}
export interface EcosystemRegistry {
  register(domain: string, capability: string): void;
  list(): T.EcosystemPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface EcosystemIntelligenceService {
  build(request: T.EcosystemRequest): T.EcosystemResult;
  query(result: T.EcosystemResult, request: T.EcosystemQueryRequest): T.EcosystemQueryResult;
  repository(): EcosystemRepository;
}
export type EcosystemService = EcosystemIntelligenceService;
export interface EcosystemDependencies {
  engine?: EcosystemIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.EcosystemArea, EcosystemAreaIntelligence>>;
  forecastEngine?: EcosystemForecastEngineContract;
  scenarioEngine?: EcosystemScenarioEngineContract;
  trendEngine?: EcosystemTrendEngineContract;
  analysisEngine?: EcosystemAnalysisEngineContract;
  networkMappingEngine?: NetworkMappingEngineContract;
  partnershipEngine?: PartnershipEngineContract;
  dependencyEngine?: DependencyEngineContract;
  collaborationEngine?: CollaborationEngineContract;
  networkEffectEngine?: NetworkEffectEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: EcosystemReasonerContract;
  repository?: EcosystemRepository;
  registry?: EcosystemRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
