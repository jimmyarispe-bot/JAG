import type * as T from "@/lib/platform/intelligence/institutional-memory/types";

export interface InstitutionalMemoryIntelligenceEngine { build(request: T.InstitutionalMemoryRequest): T.InstitutionalMemoryResult; }
export type InstitutionalMemoryEngine = InstitutionalMemoryIntelligenceEngine;
export interface InstitutionalMemoryAreaIntelligence {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryAreaSuite;
}
export interface InstitutionalMemoryForecastEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryForecastSuite;
}
export interface InstitutionalMemoryScenarioEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; forecasts: T.InstitutionalMemoryForecastSuite; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryScenarioSuite;
}
export interface InstitutionalMemoryTrendEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryTrendSuite;
}
export interface InstitutionalMemoryAnalysisEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; forecasts: T.InstitutionalMemoryForecastSuite; scenarios: T.InstitutionalMemoryScenarioSuite; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryAnalysisSuite;
}
export type KnowledgeAnalysisEngineContract = InstitutionalMemoryAnalysisEngineContract;
export interface KnowledgeGraphEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.KnowledgeGraphSuite;
}
export interface SemanticSearchEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SemanticSearchSuite;
}
export interface ExpertiseEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ExpertiseSuite;
}
export interface KnowledgeValidationEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.KnowledgeValidationSuite;
}
export interface KnowledgeEvolutionEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.KnowledgeEvolutionSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; trends: T.InstitutionalMemoryTrendSuite; scenarios: T.InstitutionalMemoryScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface InstitutionalMemoryReasonerContract {
  reason(input: { request: T.InstitutionalMemoryRequest; trends: T.InstitutionalMemoryTrendSuite; forecasts: T.InstitutionalMemoryForecastSuite; scenarios: T.InstitutionalMemoryScenarioSuite; confidence: T.InstitutionalMemoryConfidenceScore }): T.InstitutionalMemoryReasoningResult;
}
export interface InstitutionalMemoryRepository {
  save(result: T.InstitutionalMemoryResult): T.InstitutionalMemoryResult;
  get(requestId: string): T.InstitutionalMemoryResult | null;
  list(scope?: Partial<T.GraphScope>): T.InstitutionalMemoryResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.InstitutionalMemoryHistoryRecord): T.InstitutionalMemoryHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.InstitutionalMemoryHistoryRecord[];
  clear(): void;
}
export interface InstitutionalMemoryRegistry {
  register(domain: string, capability: string): void;
  list(): T.InstitutionalMemoryPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface InstitutionalMemoryIntelligenceService {
  build(request: T.InstitutionalMemoryRequest): T.InstitutionalMemoryResult;
  query(result: T.InstitutionalMemoryResult, request: T.InstitutionalMemoryQueryRequest): T.InstitutionalMemoryQueryResult;
  repository(): InstitutionalMemoryRepository;
}
export type InstitutionalMemoryService = InstitutionalMemoryIntelligenceService;
export interface InstitutionalMemoryDependencies {
  engine?: InstitutionalMemoryIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.InstitutionalMemoryArea, InstitutionalMemoryAreaIntelligence>>;
  forecastEngine?: InstitutionalMemoryForecastEngineContract;
  scenarioEngine?: InstitutionalMemoryScenarioEngineContract;
  trendEngine?: InstitutionalMemoryTrendEngineContract;
  analysisEngine?: InstitutionalMemoryAnalysisEngineContract;
  knowledgeGraphEngine?: KnowledgeGraphEngineContract;
  semanticSearchEngine?: SemanticSearchEngineContract;
  expertiseEngine?: ExpertiseEngineContract;
  knowledgeValidationEngine?: KnowledgeValidationEngineContract;
  knowledgeEvolutionEngine?: KnowledgeEvolutionEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: InstitutionalMemoryReasonerContract;
  repository?: InstitutionalMemoryRepository;
  registry?: InstitutionalMemoryRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
