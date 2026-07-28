import type {
  Allocation,
  Forecast,
  PlanningAssumption,
  PlanningBudget,
  Scenario,
} from "./types";

type PlanningStore = {
  budgets: Map<string, PlanningBudget>;
  forecasts: Map<string, Forecast>;
  scenarios: Map<string, Scenario>;
  assumptions: Map<string, PlanningAssumption>;
  allocations: Map<string, Allocation>;
};

const g = globalThis as typeof globalThis & {
  __jagPlanningStore?: PlanningStore;
};

function empty(): PlanningStore {
  return {
    budgets: new Map(),
    forecasts: new Map(),
    scenarios: new Map(),
    assumptions: new Map(),
    allocations: new Map(),
  };
}

function store(): PlanningStore {
  if (!g.__jagPlanningStore) g.__jagPlanningStore = empty();
  return g.__jagPlanningStore;
}

export function resetPlanningStoreForTests(): void {
  g.__jagPlanningStore = empty();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertPlanningBudget(b: PlanningBudget): PlanningBudget {
  store().budgets.set(b.id, b);
  return b;
}
export function listPlanningBudgets(
  organizationId: string
): readonly PlanningBudget[] {
  return Object.freeze(byOrg(store().budgets, organizationId));
}
export function getPlanningBudget(id: string): PlanningBudget | null {
  return store().budgets.get(id) ?? null;
}

export function upsertForecast(f: Forecast): Forecast {
  store().forecasts.set(f.id, f);
  return f;
}
export function listForecasts(organizationId: string): readonly Forecast[] {
  return Object.freeze(byOrg(store().forecasts, organizationId));
}
export function getForecast(id: string): Forecast | null {
  return store().forecasts.get(id) ?? null;
}

export function upsertScenario(s: Scenario): Scenario {
  store().scenarios.set(s.id, s);
  return s;
}
export function listScenarios(organizationId: string): readonly Scenario[] {
  return Object.freeze(byOrg(store().scenarios, organizationId));
}
export function getScenario(id: string): Scenario | null {
  return store().scenarios.get(id) ?? null;
}

export function upsertAssumption(a: PlanningAssumption): PlanningAssumption {
  store().assumptions.set(a.id, a);
  return a;
}
export function listAssumptions(
  organizationId: string
): readonly PlanningAssumption[] {
  return Object.freeze(byOrg(store().assumptions, organizationId));
}

export function upsertAllocation(a: Allocation): Allocation {
  store().allocations.set(a.id, a);
  return a;
}
export function listAllocations(organizationId: string): readonly Allocation[] {
  return Object.freeze(byOrg(store().allocations, organizationId));
}
