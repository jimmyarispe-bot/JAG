import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { buildBenchmarks } from "../benchmarks";
import { evaluateMetrics, metricValue } from "../metrics";
import { listAnalyses, upsertAnalysis } from "../store";
import type { FinancialAnalysis } from "../types";

export function runFinancialAnalysis(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): FinancialAnalysis {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const bench = buildBenchmarks(input);
  const ratios = Object.freeze({
    current_ratio: metricValue(snap, "current_ratio"),
    quick_ratio: metricValue(snap, "quick_ratio"),
    debt_ratio: metricValue(snap, "debt_ratio"),
    operating_margin: metricValue(snap, "operating_margin"),
    gross_margin: metricValue(snap, "gross_margin"),
    ar_days: metricValue(snap, "ar_days"),
    ap_days: metricValue(snap, "ap_days"),
    cash_conversion_cycle: metricValue(snap, "cash_conversion_cycle"),
  });

  const analysis = upsertAnalysis({
    id: newId("canal"),
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    trends: Object.freeze([
      `Revenue ${metricValue(snap, "revenue")?.toFixed(0) ?? "n/a"}`,
      `EBITDA ${metricValue(snap, "ebitda")?.toFixed(0) ?? "n/a"}`,
    ]),
    historical: Object.freeze([
      `Historical cash ${bench.historical.cash ?? 0}`,
      `Historical net income ${bench.historical.net_income ?? 0}`,
    ]),
    comparative: Object.freeze([
      `Budget total ${bench.budget.total ?? "n/a"} vs actual revenue ${metricValue(snap, "revenue")}`,
      `Forecast total ${bench.forecast.total ?? "n/a"}`,
      "Industry/peer benchmarks are placeholders in P-013.",
    ]),
    ratios,
    liquidity: Object.freeze([
      `Cash ${metricValue(snap, "cash") ?? 0}`,
      `Working capital ${metricValue(snap, "working_capital") ?? 0}`,
      `Current ratio ${ratios.current_ratio ?? "n/a"}`,
    ]),
    profitability: Object.freeze([
      `Operating margin ${ratios.operating_margin ?? "n/a"}%`,
      `Net income ${metricValue(snap, "net_income") ?? 0}`,
      `Adjusted EBITDA ${metricValue(snap, "adjusted_ebitda") ?? 0}`,
    ]),
    operational: Object.freeze([
      `AR days ${ratios.ar_days ?? "n/a"}`,
      `AP days ${ratios.ap_days ?? "n/a"}`,
      `Cash conversion cycle ${ratios.cash_conversion_cycle ?? "n/a"}`,
    ]),
    workingCapital: Object.freeze([
      `Working capital ${metricValue(snap, "working_capital") ?? 0}`,
    ]),
    capitalStructure: Object.freeze([
      `Debt ratio ${ratios.debt_ratio ?? "n/a"}`,
    ]),
    generatedAt: nowIso(),
  });

  publishCfoEvent({
    type: "cfo.analysis_completed",
    organizationId: input.organizationId,
    recordType: "financial_analysis",
    recordId: analysis.id,
    actorUserId: input.userId,
    payload: { periodKey: input.periodKey },
  });
  return analysis;
}

export { listAnalyses };
