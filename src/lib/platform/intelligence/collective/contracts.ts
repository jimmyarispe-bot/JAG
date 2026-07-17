/**
 * Collective Intelligence — contracts / interfaces only.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 * Canonical order: Engine → sub-engines → Repository → Registry → Service → Dependencies.
 */

import type * as T from "@/lib/platform/intelligence/collective/types";

export interface CollectiveIntelligenceEngine { build(request: T.CollectiveRequest): T.CollectiveResult; }
export type CollectiveEngine = CollectiveIntelligenceEngine;
export interface CollectiveAreaIntelligence {
  assess(input: { baseline: T.CollectiveBaseline; now: Date; createId: (prefix: string) => string }): T.CollectiveAreaSuite;
}
export interface CollectiveForecastEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollectiveForecastSuite;
}
export interface CollectiveScenarioEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; forecasts: T.CollectiveForecastSuite; now: Date; createId: (prefix: string) => string }): T.CollectiveScenarioSuite;
}
export interface CollectiveTrendEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollectiveTrendSuite;
}
export interface CollectiveAnalysisEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; forecasts: T.CollectiveForecastSuite; scenarios: T.CollectiveScenarioSuite; now: Date; createId: (prefix: string) => string }): T.CollectiveAnalysisSuite;
}
export interface ConsensusEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConsensusSuite;
}
export interface DistributedExpertiseEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DistributedExpertiseSuite;
}
export interface CrossDomainSynthesisEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CrossDomainSynthesisSuite;
}
export interface CollaborationEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollaborationSuite;
}
export interface ConflictResolutionEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConflictResolutionSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; trends: T.CollectiveTrendSuite; scenarios: T.CollectiveScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface CollectiveReasonerContract {
  reason(input: { request: T.CollectiveRequest; trends: T.CollectiveTrendSuite; forecasts: T.CollectiveForecastSuite; scenarios: T.CollectiveScenarioSuite; confidence: T.CollectiveConfidenceScore }): T.CollectiveReasoningResult;
}
export interface CollectiveRepository {
  save(result: T.CollectiveResult): T.CollectiveResult;
  get(requestId: string): T.CollectiveResult | null;
  list(scope?: Partial<T.GraphScope>): T.CollectiveResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.CollectiveHistoryRecord): T.CollectiveHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.CollectiveHistoryRecord[];
  clear(): void;
}
export interface CollectiveRegistry {
  register(domain: string, capability: string): void;
  list(): T.CollectivePublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface CollectiveIntelligenceService {
  build(request: T.CollectiveRequest): T.CollectiveResult;
  query(result: T.CollectiveResult, request: T.CollectiveQueryRequest): T.CollectiveQueryResult;
  repository(): CollectiveRepository;
}
export type CollectiveService = CollectiveIntelligenceService;
export interface CollectiveDependencies {
  engine?: CollectiveIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.CollectiveArea, CollectiveAreaIntelligence>>;
  forecastEngine?: CollectiveForecastEngineContract;
  scenarioEngine?: CollectiveScenarioEngineContract;
  trendEngine?: CollectiveTrendEngineContract;
  analysisEngine?: CollectiveAnalysisEngineContract;
  consensusEngine?: ConsensusEngineContract;
  distributedExpertiseEngine?: DistributedExpertiseEngineContract;
  crossDomainSynthesisEngine?: CrossDomainSynthesisEngineContract;
  collaborationEngine?: CollaborationEngineContract;
  conflictResolutionEngine?: ConflictResolutionEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: CollectiveReasonerContract;
  repository?: CollectiveRepository;
  registry?: CollectiveRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
