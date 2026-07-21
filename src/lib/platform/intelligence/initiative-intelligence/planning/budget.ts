/**
 * Budget & resource tracking — consumes soft financial signals; no FI engine duplication.
 */

import type { InitiativeBudget } from "@/lib/platform/intelligence/initiative-intelligence/types";

export function buildBudget(input?: {
  planned?: number;
  actual?: number;
  forecast?: number;
  roiHint?: number;
}): InitiativeBudget {
  const planned = input?.planned ?? Math.max(25_000, Math.round((input?.roiHint ?? 50) * 1_000));
  const actual = input?.actual ?? 0;
  const forecast = input?.forecast ?? planned;
  return {
    planned,
    actual,
    forecast,
    currency: "USD",
    staffingAssumptions: ["Role-based allocation via org assignments"],
    resourceNotes: ["Actual spend soft-read from financial intelligence when attached"],
  };
}

export function budgetVariance(budget: InitiativeBudget): { absolute: number; pct: number } {
  const absolute = budget.actual - budget.planned;
  const pct = budget.planned === 0 ? 0 : Math.round((absolute / budget.planned) * 100);
  return { absolute, pct };
}
