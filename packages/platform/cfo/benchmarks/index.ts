import { listBudgets, listForecasts } from "@finance";
import { evaluateMetrics, metricValue } from "../metrics";

export type BenchmarkPack = {
  readonly organizationId: string;
  readonly periodKey: string;
  readonly historical: Readonly<Record<string, number | null>>;
  readonly budget: Readonly<Record<string, number | null>>;
  readonly forecast: Readonly<Record<string, number | null>>;
  readonly industryPlaceholder: null;
  readonly peerPlaceholder: null;
};

export function buildBenchmarks(input: {
  organizationId: string;
  periodKey: string;
}): BenchmarkPack {
  const snap = evaluateMetrics(input);
  const budgets = listBudgets(input.organizationId).filter(
    (b) => b.periodKey === input.periodKey || input.periodKey.startsWith(b.periodKey)
  );
  const budgetTotal = budgets
    .flatMap((b) => b.lines)
    .reduce((s, l) => s + l.amount, 0);
  const forecasts = listForecasts(input.organizationId).filter(
    (f) => f.periodKey === input.periodKey
  );
  const forecastTotal = forecasts
    .flatMap((f) => f.lines)
    .reduce((s, l) => s + l.amount, 0);

  return Object.freeze({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    historical: Object.freeze({
      revenue: metricValue(snap, "revenue"),
      ebitda: metricValue(snap, "ebitda"),
      cash: metricValue(snap, "cash"),
      net_income: metricValue(snap, "net_income"),
    }),
    budget: Object.freeze({
      total: budgetTotal || null,
      count: budgets.length,
    }),
    forecast: Object.freeze({
      total: forecastTotal || null,
      count: forecasts.length,
    }),
    industryPlaceholder: null,
    peerPlaceholder: null,
  });
}
