import type * as T from "@/lib/platform/intelligence/impact/types";
export interface ImpactIntelligenceEngine { build(request: T.ImpactRequest): T.ImpactResult; }
export type ImpactEngine = ImpactIntelligenceEngine;
export interface ImpactAreaIntelligence { assess(input: { baseline: T.ImpactBaseline; now: Date; createId: (prefix: string) => string }): T.ImpactAreaSuite; }
export interface ImpactMeasurementEngineContract { assess(input: { baseline: T.ImpactBaseline; now: Date; createId: (prefix: string) => string }): T.ImpactMeasurementSuite; }
export interface OutcomeEngineContract { assess(input: { baseline: T.ImpactBaseline; areas: Record<T.ImpactArea, T.ImpactAreaSuite>; now: Date; createId: (prefix: string) => string }): T.OutcomeSuite; }
export interface RoiEngineContract { assess(input: { baseline: T.ImpactBaseline; outcomes: T.OutcomeSuite; now: Date; createId: (prefix: string) => string }): T.RoiSuite; }
export interface ImpactReasonerContract { reason(input: { request: T.ImpactRequest; outcomes: T.OutcomeSuite; measurements: T.ImpactMeasurementSuite; confidence: T.ImpactConfidenceScore }): T.ImpactReasoningResult; }
export interface ImpactRepository { save(result: T.ImpactResult): T.ImpactResult; get(requestId: string): T.ImpactResult | null; list(scope?: Partial<T.GraphScope>): T.ImpactResult[]; remove(requestId: string): boolean; saveHistory(record: T.ImpactHistoryRecord): T.ImpactHistoryRecord; listHistory(scope?: Partial<T.GraphScope>): T.ImpactHistoryRecord[]; clear(): void; }
export interface ImpactRegistry { register(domain: string, capability: string): void; list(): T.ImpactPublisher[]; isRegistered(domain: string): boolean; clear(): void; }
export interface ImpactIntelligenceService { build(request: T.ImpactRequest): T.ImpactResult; query(result: T.ImpactResult, request: T.ImpactQueryRequest): T.ImpactQueryResult; repository(): ImpactRepository; }
export type ImpactService = ImpactIntelligenceService;
export interface ImpactDependencies {
  engine?: ImpactIntelligenceEngine; areaIntelligence?: Partial<Record<T.ImpactArea, ImpactAreaIntelligence>>;
  measurementEngine?: ImpactMeasurementEngineContract; outcomeEngine?: OutcomeEngineContract; roiEngine?: RoiEngineContract;
  reasoner?: ImpactReasonerContract; repository?: ImpactRepository; registry?: ImpactRegistry;
  now?: () => Date; createId?: (prefix: string) => string;
}
