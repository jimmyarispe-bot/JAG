/**
 * Competitive Intelligence — contracts / interfaces only.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 * Canonical order: Engine → sub-engines → Repository → Registry → Service → Dependencies.
 */

import type * as T from "@/lib/platform/intelligence/competitive/types";

export interface CompetitiveIntelligenceEngine { build(request: T.CompetitiveRequest): T.CompetitiveResult; }
export type CompetitiveEngine = CompetitiveIntelligenceEngine;
export interface CompetitiveAreaIntelligence {
  assess(input: { baseline: T.CompetitiveBaseline; now: Date; createId: (prefix: string) => string }): T.CompetitiveAreaSuite;
}
export interface CompetitiveForecastEngineContract {
  assess(input: { baseline: T.CompetitiveBaseline; areas: Record<T.CompetitiveArea, T.CompetitiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CompetitiveForecastSuite;
}
export interface CompetitiveScenarioEngineContract {
  assess(input: { baseline: T.CompetitiveBaseline; areas: Record<T.CompetitiveArea, T.CompetitiveAreaSuite>; forecasts: T.CompetitiveForecastSuite; now: Date; createId: (prefix: string) => string }): T.CompetitiveScenarioSuite;
}
export interface CompetitiveTrendEngineContract {
  assess(input: { baseline: T.CompetitiveBaseline; areas: Record<T.CompetitiveArea, T.CompetitiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CompetitiveTrendSuite;
}
export interface CompetitiveAnalysisEngineContract {
  assess(input: { baseline: T.CompetitiveBaseline; areas: Record<T.CompetitiveArea, T.CompetitiveAreaSuite>; forecasts: T.CompetitiveForecastSuite; scenarios: T.CompetitiveScenarioSuite; now: Date; createId: (prefix: string) => string }): T.CompetitiveAnalysisSuite;
}
export interface CompetitiveReasonerContract {
  reason(input: { request: T.CompetitiveRequest; trends: T.CompetitiveTrendSuite; forecasts: T.CompetitiveForecastSuite; scenarios: T.CompetitiveScenarioSuite; confidence: T.CompetitiveConfidenceScore }): T.CompetitiveReasoningResult;
}
export interface CompetitiveRepository {
  save(result: T.CompetitiveResult): T.CompetitiveResult;
  get(requestId: string): T.CompetitiveResult | null;
  list(scope?: Partial<T.GraphScope>): T.CompetitiveResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.CompetitiveHistoryRecord): T.CompetitiveHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.CompetitiveHistoryRecord[];
  clear(): void;
}
export interface CompetitiveRegistry {
  register(domain: string, capability: string): void;
  list(): T.CompetitivePublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface CompetitiveIntelligenceService {
  build(request: T.CompetitiveRequest): T.CompetitiveResult;
  query(result: T.CompetitiveResult, request: T.CompetitiveQueryRequest): T.CompetitiveQueryResult;
  repository(): CompetitiveRepository;
}
export type CompetitiveService = CompetitiveIntelligenceService;
export interface CompetitiveDependencies {
  engine?: CompetitiveIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.CompetitiveArea, CompetitiveAreaIntelligence>>;
  forecastEngine?: CompetitiveForecastEngineContract;
  scenarioEngine?: CompetitiveScenarioEngineContract;
  trendEngine?: CompetitiveTrendEngineContract;
  analysisEngine?: CompetitiveAnalysisEngineContract;
  reasoner?: CompetitiveReasonerContract;
  repository?: CompetitiveRepository;
  registry?: CompetitiveRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
