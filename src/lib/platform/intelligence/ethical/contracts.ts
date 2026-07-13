import type * as T from "@/lib/platform/intelligence/ethical/types";

export interface EthicalIntelligenceEngine { build(request: T.EthicalRequest): T.EthicalResult; }
export type EthicalEngine = EthicalIntelligenceEngine;
export interface EthicalAreaIntelligence {
  assess(input: { baseline: T.EthicalBaseline; now: Date; createId: (prefix: string) => string }): T.EthicalAreaSuite;
}
export interface EthicalForecastEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EthicalForecastSuite;
}
export interface EthicalScenarioEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; forecasts: T.EthicalForecastSuite; now: Date; createId: (prefix: string) => string }): T.EthicalScenarioSuite;
}
export interface EthicalTrendEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EthicalTrendSuite;
}
export interface EthicalAnalysisEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; forecasts: T.EthicalForecastSuite; scenarios: T.EthicalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EthicalAnalysisSuite;
}
export interface ValuesAlignmentEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ValuesAlignmentSuite;
}
export interface FairnessEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.FairnessSuite;
}
export interface HumanImpactEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.HumanImpactSuite;
}
export interface AiEthicsEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.AiEthicsSuite;
}
export interface GovernanceEthicsEngineContract {
  assess(input: { baseline: T.EthicalBaseline; areas: Record<T.EthicalArea, T.EthicalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.GovernanceEthicsSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.EthicalBaseline; trends: T.EthicalTrendSuite; scenarios: T.EthicalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface EthicalReasonerContract {
  reason(input: { request: T.EthicalRequest; trends: T.EthicalTrendSuite; forecasts: T.EthicalForecastSuite; scenarios: T.EthicalScenarioSuite; confidence: T.EthicalConfidenceScore }): T.EthicalReasoningResult;
}
export interface EthicalRepository {
  save(result: T.EthicalResult): T.EthicalResult;
  get(requestId: string): T.EthicalResult | null;
  list(scope?: Partial<T.GraphScope>): T.EthicalResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.EthicalHistoryRecord): T.EthicalHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.EthicalHistoryRecord[];
  clear(): void;
}
export interface EthicalRegistry {
  register(domain: string, capability: string): void;
  list(): T.EthicalPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface EthicalIntelligenceService {
  build(request: T.EthicalRequest): T.EthicalResult;
  query(result: T.EthicalResult, request: T.EthicalQueryRequest): T.EthicalQueryResult;
  repository(): EthicalRepository;
}
export type EthicalService = EthicalIntelligenceService;
export interface EthicalDependencies {
  engine?: EthicalIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.EthicalArea, EthicalAreaIntelligence>>;
  forecastEngine?: EthicalForecastEngineContract;
  scenarioEngine?: EthicalScenarioEngineContract;
  trendEngine?: EthicalTrendEngineContract;
  analysisEngine?: EthicalAnalysisEngineContract;
  valuesAlignmentEngine?: ValuesAlignmentEngineContract;
  fairnessEngine?: FairnessEngineContract;
  humanImpactEngine?: HumanImpactEngineContract;
  aiEthicsEngine?: AiEthicsEngineContract;
  governanceEthicsEngine?: GovernanceEthicsEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: EthicalReasonerContract;
  repository?: EthicalRepository;
  registry?: EthicalRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
