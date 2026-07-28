import { createBudget } from "../../budgets";
import { newId, nowIso } from "../../ids";
import { publishOperationalFinanceEvent } from "../../operations/events";
import {
  getPlanningBudget,
  listPlanningBudgets,
  upsertPlanningBudget,
} from "../store";
import type { BudgetHorizon, BudgetKind, PlanningBudget } from "../types";

function mapHorizon(
  horizon: BudgetHorizon
): "annual" | "quarterly" | "monthly" {
  if (horizon === "rolling") return "monthly";
  return horizon;
}

function mapScope(
  kind: BudgetKind
): "organization" | "department" | "program" | "project" | "entity" {
  if (kind === "department") return "department";
  if (kind === "program" || kind === "grant") return "program";
  if (kind === "project" || kind === "capital") return "project";
  return "organization";
}

export function createPlanningBudget(input: {
  organizationId: string;
  userId: string;
  name: string;
  horizon: BudgetHorizon;
  kind: BudgetKind;
  scope?: string;
  scopeId?: string | null;
  periodKey: string;
  lines: readonly {
    accountId: string;
    amount: number;
    dimensionFilters?: Readonly<Record<string, string>>;
  }[];
  scenarioKey?: string | null;
}): PlanningBudget | { error: string } {
  const foundation = createBudget({
    organizationId: input.organizationId,
    userId: input.userId,
    name: input.name,
    horizon: mapHorizon(input.horizon),
    scope: mapScope(input.kind),
    scopeId: input.scopeId,
    periodKey: input.periodKey,
    lines: input.lines.map((l) => ({
      accountId: l.accountId,
      amount: l.amount,
    })),
    scenarioKey: input.scenarioKey,
  });
  if ("error" in foundation) return foundation;

  const budget = upsertPlanningBudget({
    id: newId("pbud"),
    organizationId: input.organizationId,
    name: input.name,
    horizon: input.horizon,
    kind: input.kind,
    scope: input.scope ?? mapScope(input.kind),
    scopeId: input.scopeId ?? null,
    periodKey: input.periodKey,
    version: 1,
    parentBudgetId: null,
    foundationBudgetId: foundation.id,
    lines: Object.freeze(
      input.lines.map((l) =>
        Object.freeze({
          accountId: l.accountId,
          amount: l.amount,
          dimensionFilters: l.dimensionFilters
            ? Object.freeze({ ...l.dimensionFilters })
            : undefined,
        })
      )
    ),
    scenarioKey: input.scenarioKey ?? null,
    createdAt: nowIso(),
    createdBy: input.userId,
  });

  publishOperationalFinanceEvent({
    type: "finance.budget_created",
    organizationId: input.organizationId,
    recordType: "planning_budget",
    recordId: budget.id,
    actorUserId: input.userId,
    payload: {
      horizon: budget.horizon,
      kind: budget.kind,
      periodKey: budget.periodKey,
      foundationBudgetId: budget.foundationBudgetId,
    },
  });

  return budget;
}

export function versionBudget(input: {
  organizationId: string;
  userId: string;
  budgetId: string;
  lines?: PlanningBudget["lines"];
  name?: string;
}): PlanningBudget | { error: string } {
  const prior = getPlanningBudget(input.budgetId);
  if (!prior || prior.organizationId !== input.organizationId) {
    return { error: "budget not found" };
  }
  const next = upsertPlanningBudget({
    ...prior,
    id: newId("pbud"),
    name: input.name ?? prior.name,
    version: prior.version + 1,
    parentBudgetId: prior.id,
    lines: input.lines ?? prior.lines,
    createdAt: nowIso(),
    createdBy: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.budget_versioned",
    organizationId: input.organizationId,
    recordType: "planning_budget",
    recordId: next.id,
    actorUserId: input.userId,
    payload: {
      parentBudgetId: prior.id,
      version: next.version,
    },
  });
  return next;
}

export { listPlanningBudgets, getPlanningBudget };
