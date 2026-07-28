import { listBudgets } from "../../budgets";
import { newId, nowIso } from "../../ids";
import { publishOperationalFinanceEvent } from "../../operations/events";
import { computeAccountBalances } from "../financial-statements/balances";
import { upsertVariance } from "../store";
import type { VarianceReport } from "../types";

function pct(actual: number, baseline: number): number | null {
  if (baseline === 0) return actual === 0 ? 0 : null;
  return ((actual - baseline) / Math.abs(baseline)) * 100;
}

export function computeVariance(input: {
  organizationId: string;
  userId: string;
  mode:
    | "budget_vs_actual"
    | "forecast_vs_actual"
    | "prior_year"
    | "prior_period";
  periodKey: string;
  comparePeriodKey?: string | null;
  budgetId?: string | null;
  forecastLines?: readonly { label: string; amount: number }[];
}): VarianceReport {
  const actuals = computeAccountBalances({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    consolidated: true,
  });

  const rows: VarianceReport["rows"][number][] = [];

  if (input.mode === "budget_vs_actual") {
    const budgets = listBudgets(input.organizationId);
    const budget = input.budgetId
      ? budgets.find((b) => b.id === input.budgetId)
      : budgets.find((b) => b.periodKey === input.periodKey);
    if (!budget) throw new Error("budget not found for variance");
    for (const line of budget.lines) {
      const actual = actuals.find((a) => a.account.id === line.accountId);
      const actualAmt = actual?.balance ?? 0;
      const baseline = line.amount;
      rows.push(
        Object.freeze({
          label: actual
            ? `${actual.account.number} ${actual.account.name}`
            : line.accountId,
          baseline,
          actual: actualAmt,
          dollarVariance: actualAmt - baseline,
          percentVariance: pct(actualAmt, baseline),
        })
      );
    }
  } else if (input.mode === "forecast_vs_actual") {
    const forecast = input.forecastLines ?? [];
    if (forecast.length === 0) {
      throw new Error("forecastLines required for forecast_vs_actual");
    }
    for (const f of forecast) {
      const actual = actuals.find(
        (a) =>
          a.account.name.toLowerCase().includes(f.label.toLowerCase()) ||
          a.account.number === f.label
      );
      const actualAmt = actual?.balance ?? 0;
      rows.push(
        Object.freeze({
          label: f.label,
          baseline: f.amount,
          actual: actualAmt,
          dollarVariance: actualAmt - f.amount,
          percentVariance: pct(actualAmt, f.amount),
        })
      );
    }
  } else {
    const compareKey =
      input.comparePeriodKey ??
      (input.mode === "prior_year"
        ? String(Number(input.periodKey.slice(0, 4)) - 1) +
          input.periodKey.slice(4)
        : input.periodKey);
    const prior = computeAccountBalances({
      organizationId: input.organizationId,
      periodKey: compareKey,
      consolidated: true,
    });
    for (const a of actuals) {
      const p = prior.find((x) => x.account.id === a.account.id);
      const baseline = p?.balance ?? 0;
      rows.push(
        Object.freeze({
          label: `${a.account.number} ${a.account.name}`,
          baseline,
          actual: a.balance,
          dollarVariance: a.balance - baseline,
          percentVariance: pct(a.balance, baseline),
        })
      );
    }
  }

  const report = upsertVariance({
    id: newId("var"),
    organizationId: input.organizationId,
    mode: input.mode,
    periodKey: input.periodKey,
    rows: Object.freeze(rows),
    generatedAt: nowIso(),
  });

  publishOperationalFinanceEvent({
    type: "finance.variance_computed",
    organizationId: input.organizationId,
    recordType: "variance_report",
    recordId: report.id,
    actorUserId: input.userId,
    payload: { mode: report.mode, periodKey: report.periodKey, rows: rows.length },
  });

  return report;
}
