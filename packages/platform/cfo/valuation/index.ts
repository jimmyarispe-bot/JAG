import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { evaluateMetrics, metricValue } from "../metrics";
import { listValuations, upsertValuation } from "../store";
import type { ValuationApproach, ValuationReport } from "../types";

export function computeValuation(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
  approach: ValuationApproach;
  multiple?: number;
  adjustmentTotal?: number;
}): ValuationReport {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    adjustmentTotal: input.adjustmentTotal,
  });
  const ebitda = metricValue(snap, "adjusted_ebitda") ?? metricValue(snap, "ebitda") ?? 0;
  const netIncome = metricValue(snap, "net_income") ?? 0;
  const cash = metricValue(snap, "cash") ?? 0;
  const workingCapital = metricValue(snap, "working_capital") ?? 0;
  const multiple = input.multiple ?? 6;

  let value: number | null = null;
  let notes = "";

  switch (input.approach) {
    case "ebitda_multiple":
    case "market_multiple":
      value = ebitda * multiple;
      notes = `${input.approach} using ${multiple}x on adjusted/EBITDA from metric registry.`;
      break;
    case "income":
      value = netIncome * (multiple + 2);
      notes = "Income approach: capitalized earnings proxy from net income.";
      break;
    case "asset":
      value = cash + Math.max(workingCapital, 0);
      notes = "Asset approach: cash + working capital proxy (foundation).";
      break;
    case "dcf_placeholder":
      value = null;
      notes =
        "DCF placeholder — full discounted cash flow deferred; use scenario comparisons.";
      break;
  }

  const report = upsertValuation({
    id: newId("val"),
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    approach: input.approach,
    value,
    multiple: input.approach === "dcf_placeholder" ? null : multiple,
    notes,
    scenarioComparisons: Object.freeze([
      {
        label: "bull",
        value: value == null ? null : value * 1.2,
      },
      { label: "base", value },
      {
        label: "bear",
        value: value == null ? null : value * 0.8,
      },
    ]),
    generatedAt: nowIso(),
  });

  publishCfoEvent({
    type: "cfo.valuation_computed",
    organizationId: input.organizationId,
    recordType: "valuation",
    recordId: report.id,
    actorUserId: input.userId,
    payload: { approach: report.approach, value: report.value },
  });
  return report;
}

export function valuationHistory(organizationId: string): readonly ValuationReport[] {
  return listValuations(organizationId);
}

export { listValuations };
