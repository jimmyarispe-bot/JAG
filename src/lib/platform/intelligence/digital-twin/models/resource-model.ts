/**
 * Resource model — soft view of shared resources.
 */

import type { OrganizationModel } from "@/lib/platform/intelligence/digital-twin/types";

export interface ResourceSnapshot {
  budgetAvailable: number;
  staffAvailable: number;
  leadershipAttention: number;
}

export function resourceSnapshot(model: OrganizationModel): ResourceSnapshot {
  return {
    budgetAvailable: Math.max(0, model.finance.operatingBudget - model.finance.spent),
    staffAvailable: Math.round(model.staffing.headcount * (1 - model.staffing.vacancyRate)),
    leadershipAttention: Math.max(0.1, 1 - model.initiatives.length * 0.08),
  };
}
