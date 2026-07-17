/**
 * Cultural Intelligence — contracts / interfaces only.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 * Canonical order: Engine → sub-engines → Repository → Registry → Service → Dependencies.
 */

import type * as T from "@/lib/platform/intelligence/cultural/types";

export interface CulturalIntelligenceEngine { build(request: T.CulturalRequest): T.CulturalResult; }
export type CulturalEngine = CulturalIntelligenceEngine;
export interface CulturalAreaIntelligence {
  assess(input: { baseline: T.CulturalBaseline; now: Date; createId: (prefix: string) => string }): T.CulturalAreaSuite;
}
export interface CulturalForecastEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CulturalForecastSuite;
}
export interface CulturalScenarioEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; forecasts: T.CulturalForecastSuite; now: Date; createId: (prefix: string) => string }): T.CulturalScenarioSuite;
}
export interface CulturalTrendEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CulturalTrendSuite;
}
export interface CulturalAnalysisEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; forecasts: T.CulturalForecastSuite; scenarios: T.CulturalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.CulturalAnalysisSuite;
}
export interface CultureMappingEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CultureMappingSuite;
}
export interface EngagementEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EngagementSuite;
}
export interface MissionAlignmentEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.MissionAlignmentSuite;
}
export interface ValuesAlignmentEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ValuesAlignmentSuite;
}
export interface CollaborationEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollaborationSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.CulturalBaseline; trends: T.CulturalTrendSuite; scenarios: T.CulturalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface CulturalReasonerContract {
  reason(input: { request: T.CulturalRequest; trends: T.CulturalTrendSuite; forecasts: T.CulturalForecastSuite; scenarios: T.CulturalScenarioSuite; confidence: T.CulturalConfidenceScore }): T.CulturalReasoningResult;
}
export interface CulturalRepository {
  save(result: T.CulturalResult): T.CulturalResult;
  get(requestId: string): T.CulturalResult | null;
  list(scope?: Partial<T.GraphScope>): T.CulturalResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.CulturalHistoryRecord): T.CulturalHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.CulturalHistoryRecord[];
  clear(): void;
}
export interface CulturalRegistry {
  register(domain: string, capability: string): void;
  list(): T.CulturalPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface CulturalIntelligenceService {
  build(request: T.CulturalRequest): T.CulturalResult;
  query(result: T.CulturalResult, request: T.CulturalQueryRequest): T.CulturalQueryResult;
  repository(): CulturalRepository;
}
export type CulturalService = CulturalIntelligenceService;
export interface CulturalDependencies {
  engine?: CulturalIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.CulturalArea, CulturalAreaIntelligence>>;
  forecastEngine?: CulturalForecastEngineContract;
  scenarioEngine?: CulturalScenarioEngineContract;
  trendEngine?: CulturalTrendEngineContract;
  analysisEngine?: CulturalAnalysisEngineContract;
  cultureMappingEngine?: CultureMappingEngineContract;
  engagementEngine?: EngagementEngineContract;
  missionAlignmentEngine?: MissionAlignmentEngineContract;
  valuesAlignmentEngine?: ValuesAlignmentEngineContract;
  collaborationEngine?: CollaborationEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: CulturalReasonerContract;
  repository?: CulturalRepository;
  registry?: CulturalRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
