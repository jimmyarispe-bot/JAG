import type * as T from "@/lib/platform/intelligence/stakeholder/types";

export interface StakeholderIntelligenceEngine { build(request: T.StakeholderRequest): T.StakeholderResult; }
export type StakeholderEngine = StakeholderIntelligenceEngine;
export interface StakeholderAreaIntelligence {
  assess(input: { baseline: T.StakeholderBaseline; now: Date; createId: (prefix: string) => string }): T.StakeholderAreaSuite;
}
export interface StakeholderForecastEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.StakeholderForecastSuite;
}
export interface StakeholderScenarioEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; forecasts: T.StakeholderForecastSuite; now: Date; createId: (prefix: string) => string }): T.StakeholderScenarioSuite;
}
export interface StakeholderTrendEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.StakeholderTrendSuite;
}
export interface StakeholderAnalysisEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; forecasts: T.StakeholderForecastSuite; scenarios: T.StakeholderScenarioSuite; now: Date; createId: (prefix: string) => string }): T.StakeholderAnalysisSuite;
}
export interface StakeholderMappingEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.StakeholderMappingSuite;
}
export interface InfluenceEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.InfluenceSuite;
}
export interface RelationshipEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.RelationshipSuite;
}
export interface SentimentEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SentimentSuite;
}
export interface EngagementEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EngagementSuite;
}
export interface ConflictDetectionEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; areas: Record<T.StakeholderArea, T.StakeholderAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConflictDetectionSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.StakeholderBaseline; trends: T.StakeholderTrendSuite; scenarios: T.StakeholderScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface StakeholderReasonerContract {
  reason(input: { request: T.StakeholderRequest; trends: T.StakeholderTrendSuite; forecasts: T.StakeholderForecastSuite; scenarios: T.StakeholderScenarioSuite; confidence: T.StakeholderConfidenceScore }): T.StakeholderReasoningResult;
}
export interface StakeholderRepository {
  save(result: T.StakeholderResult): T.StakeholderResult;
  get(requestId: string): T.StakeholderResult | null;
  list(scope?: Partial<T.GraphScope>): T.StakeholderResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.StakeholderHistoryRecord): T.StakeholderHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.StakeholderHistoryRecord[];
  clear(): void;
}
export interface StakeholderRegistry {
  register(domain: string, capability: string): void;
  list(): T.StakeholderPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface StakeholderIntelligenceService {
  build(request: T.StakeholderRequest): T.StakeholderResult;
  query(result: T.StakeholderResult, request: T.StakeholderQueryRequest): T.StakeholderQueryResult;
  repository(): StakeholderRepository;
}
export type StakeholderService = StakeholderIntelligenceService;
export interface StakeholderDependencies {
  engine?: StakeholderIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.StakeholderArea, StakeholderAreaIntelligence>>;
  forecastEngine?: StakeholderForecastEngineContract;
  scenarioEngine?: StakeholderScenarioEngineContract;
  trendEngine?: StakeholderTrendEngineContract;
  analysisEngine?: StakeholderAnalysisEngineContract;
  stakeholderMappingEngine?: StakeholderMappingEngineContract;
  influenceEngine?: InfluenceEngineContract;
  relationshipEngine?: RelationshipEngineContract;
  sentimentEngine?: SentimentEngineContract;
  engagementEngine?: EngagementEngineContract;
  conflictDetectionEngine?: ConflictDetectionEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: StakeholderReasonerContract;
  repository?: StakeholderRepository;
  registry?: StakeholderRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
