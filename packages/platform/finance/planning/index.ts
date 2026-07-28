/**
 * P-012 — Financial planning (consumes FinanceEngine; no AI CFO).
 */

export { PLANNING_GUARDS } from "./types";
export type {
  Allocation,
  BudgetHorizon,
  BudgetKind,
  Forecast,
  ForecastMethod,
  PlanningAssumption,
  PlanningBudget,
  PlanningModelSnapshot,
  Scenario,
  ScenarioKind,
} from "./types";

export {
  FinancialPlanningEngine,
  createFinancialPlanningEngine,
} from "./engine";

export { resetPlanningStoreForTests } from "./store";
export {
  createPlanningBudget,
  versionBudget,
  listPlanningBudgets,
} from "./budgets";
export { createForecast, listForecasts } from "./forecasts";
export {
  createScenario,
  compareScenarios,
  listScenarios,
} from "./scenarios";
export { setAssumption, listAssumptions } from "./assumptions";
export { postAllocation, listAllocations } from "./allocations";
export { planningModelSnapshot } from "./planning-model";
