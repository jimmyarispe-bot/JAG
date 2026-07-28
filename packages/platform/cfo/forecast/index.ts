/** Forecast reasoning helpers — consume FinancialPlanningEngine forecasts. */

import { listForecasts } from "@finance";
import { evaluateMetrics, metricValue } from "../metrics";

export function forecastOutlook(input: {
  organizationId: string;
  periodKey: string;
}): {
  readonly forecastCount: number;
  readonly forecastRevenueHint: number;
  readonly actualRevenue: number | null;
} {
  const forecasts = listForecasts(input.organizationId).filter(
    (f) => f.periodKey === input.periodKey || f.method === "revenue"
  );
  const forecastRevenueHint = forecasts
    .flatMap((f) => f.lines)
    .reduce((s, l) => s + l.amount, 0);
  const snap = evaluateMetrics(input);
  return Object.freeze({
    forecastCount: forecasts.length,
    forecastRevenueHint,
    actualRevenue: metricValue(snap, "revenue"),
  });
}
