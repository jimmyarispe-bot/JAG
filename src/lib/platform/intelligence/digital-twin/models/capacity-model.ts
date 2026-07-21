/**
 * Capacity model helpers for twin simulations.
 */

import type { OrganizationModel } from "@/lib/platform/intelligence/digital-twin/types";

export function staffingCapacity(model: OrganizationModel): number {
  return Math.max(0, model.staffing.headcount * (1 - model.staffing.vacancyRate));
}

export function budgetHeadroom(model: OrganizationModel): number {
  return model.finance.operatingBudget - model.finance.forecast;
}

export function operationalSlack(model: OrganizationModel): number {
  return Math.max(0, 1 - model.operations.utilization);
}
