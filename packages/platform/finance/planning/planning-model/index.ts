import { nowIso } from "../../ids";
import {
  listAllocations,
  listAssumptions,
  listForecasts,
  listPlanningBudgets,
  listScenarios,
} from "../store";
import type { PlanningModelSnapshot } from "../types";

export function planningModelSnapshot(
  organizationId: string
): PlanningModelSnapshot {
  return Object.freeze({
    organizationId,
    budgetCount: listPlanningBudgets(organizationId).length,
    forecastCount: listForecasts(organizationId).length,
    scenarioCount: listScenarios(organizationId).length,
    assumptionCount: listAssumptions(organizationId).length,
    allocationCount: listAllocations(organizationId).length,
    generatedAt: nowIso(),
  });
}
