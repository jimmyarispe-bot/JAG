import { resetCfoOpsStoreForTests } from "./events";
import type {
  AssistantAnswer,
  BoardReport,
  CashRunwayReport,
  CfoInsight,
  CfoRecommendation,
  CfoScenarioResult,
  EbitdaAdjustment,
  EbitdaReport,
  FinancialAnalysis,
  QoeReport,
  ValuationReport,
} from "./types";

type CfoStore = {
  adjustments: Map<string, EbitdaAdjustment>;
  ebitda: Map<string, EbitdaReport>;
  runway: Map<string, CashRunwayReport>;
  qoe: Map<string, QoeReport>;
  valuations: Map<string, ValuationReport>;
  scenarios: Map<string, CfoScenarioResult>;
  recommendations: Map<string, CfoRecommendation>;
  boards: Map<string, BoardReport>;
  insights: Map<string, CfoInsight>;
  analyses: Map<string, FinancialAnalysis>;
  assistant: Map<string, AssistantAnswer>;
};

const g = globalThis as typeof globalThis & { __jagCfoStore?: CfoStore };

function empty(): CfoStore {
  return {
    adjustments: new Map(),
    ebitda: new Map(),
    runway: new Map(),
    qoe: new Map(),
    valuations: new Map(),
    scenarios: new Map(),
    recommendations: new Map(),
    boards: new Map(),
    insights: new Map(),
    analyses: new Map(),
    assistant: new Map(),
  };
}

function store(): CfoStore {
  if (!g.__jagCfoStore) g.__jagCfoStore = empty();
  return g.__jagCfoStore;
}

export function resetCfoStoreForTests(): void {
  g.__jagCfoStore = empty();
  resetCfoOpsStoreForTests();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertAdjustment(a: EbitdaAdjustment): EbitdaAdjustment {
  store().adjustments.set(a.id, a);
  return a;
}
export function listAdjustments(
  organizationId: string,
  periodKey?: string
): readonly EbitdaAdjustment[] {
  return Object.freeze(
    byOrg(store().adjustments, organizationId).filter((a) =>
      periodKey ? a.periodKey === periodKey : true
    )
  );
}

export function upsertEbitda(r: EbitdaReport): EbitdaReport {
  store().ebitda.set(r.id, r);
  return r;
}
export function listEbitda(organizationId: string): readonly EbitdaReport[] {
  return Object.freeze(byOrg(store().ebitda, organizationId));
}

export function upsertRunway(r: CashRunwayReport): CashRunwayReport {
  store().runway.set(r.id, r);
  return r;
}
export function listRunway(organizationId: string): readonly CashRunwayReport[] {
  return Object.freeze(byOrg(store().runway, organizationId));
}

export function upsertQoe(r: QoeReport): QoeReport {
  store().qoe.set(r.id, r);
  return r;
}
export function listQoe(organizationId: string): readonly QoeReport[] {
  return Object.freeze(byOrg(store().qoe, organizationId));
}

export function upsertValuation(r: ValuationReport): ValuationReport {
  store().valuations.set(r.id, r);
  return r;
}
export function listValuations(
  organizationId: string
): readonly ValuationReport[] {
  return Object.freeze(byOrg(store().valuations, organizationId));
}

export function upsertScenario(s: CfoScenarioResult): CfoScenarioResult {
  store().scenarios.set(s.id, s);
  return s;
}
export function listScenarios(
  organizationId: string
): readonly CfoScenarioResult[] {
  return Object.freeze(byOrg(store().scenarios, organizationId));
}

export function upsertRecommendation(
  r: CfoRecommendation
): CfoRecommendation {
  store().recommendations.set(r.id, r);
  return r;
}
export function listRecommendations(
  organizationId: string
): readonly CfoRecommendation[] {
  return Object.freeze(byOrg(store().recommendations, organizationId));
}

export function upsertBoard(b: BoardReport): BoardReport {
  store().boards.set(b.id, b);
  return b;
}
export function listBoards(organizationId: string): readonly BoardReport[] {
  return Object.freeze(byOrg(store().boards, organizationId));
}

export function upsertInsight(i: CfoInsight): CfoInsight {
  store().insights.set(i.id, i);
  return i;
}
export function listInsights(organizationId: string): readonly CfoInsight[] {
  return Object.freeze(byOrg(store().insights, organizationId));
}

export function upsertAnalysis(a: FinancialAnalysis): FinancialAnalysis {
  store().analyses.set(a.id, a);
  return a;
}
export function listAnalyses(
  organizationId: string
): readonly FinancialAnalysis[] {
  return Object.freeze(byOrg(store().analyses, organizationId));
}

export function upsertAssistant(a: AssistantAnswer): AssistantAnswer {
  store().assistant.set(a.id, a);
  return a;
}
export function listAssistantAnswers(
  organizationId: string
): readonly AssistantAnswer[] {
  return Object.freeze(byOrg(store().assistant, organizationId));
}
