/**
 * FinancialPlanningEngine — planning layer over FinanceEngine.
 * No AI recommendations.
 */

import {
  listEvidenceRecords,
  listMemoryRecords,
  listOperationalEvents,
  listTwinProjections,
  OPERATIONAL_SINKS,
} from "../operations/events";
import { postAllocation, listAllocations } from "./allocations";
import { setAssumption, listAssumptions } from "./assumptions";
import {
  createPlanningBudget,
  versionBudget,
  listPlanningBudgets,
  getPlanningBudget,
} from "./budgets";
import { createForecast, listForecasts } from "./forecasts";
import { planningModelSnapshot } from "./planning-model";
import {
  createScenario,
  compareScenarios,
  listScenarios,
  getScenario,
} from "./scenarios";
import { PLANNING_GUARDS } from "./types";

export class FinancialPlanningEngine {
  readonly guards = PLANNING_GUARDS;
  readonly sinks = OPERATIONAL_SINKS;

  createBudget = createPlanningBudget;
  versionBudget = versionBudget;
  listBudgets = listPlanningBudgets;
  getBudget = getPlanningBudget;

  createForecast = createForecast;
  listForecasts = listForecasts;

  createScenario = createScenario;
  compareScenarios = compareScenarios;
  listScenarios = listScenarios;
  getScenario = getScenario;

  setAssumption = setAssumption;
  listAssumptions = listAssumptions;

  postAllocation = postAllocation;
  listAllocations = listAllocations;

  modelSnapshot = planningModelSnapshot;

  listOperationalEvents = listOperationalEvents;
  listTwinProjections = listTwinProjections;
  listEvidenceRecords = listEvidenceRecords;
  listMemoryRecords = listMemoryRecords;
}

export function createFinancialPlanningEngine(): FinancialPlanningEngine {
  return new FinancialPlanningEngine();
}
