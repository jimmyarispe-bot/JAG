import { evaluateMetrics, metricValue } from "../metrics";
import { computeRunway } from "../runway";

export function assessFinancialRisks(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): readonly string[] {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const risks: string[] = [];
  const cash = metricValue(snap, "cash") ?? 0;
  const margin = metricValue(snap, "operating_margin");
  const current = metricValue(snap, "current_ratio");
  const runway = computeRunway({
    organizationId: input.organizationId,
    userId: input.userId,
    periodKey: input.periodKey,
  });
  if (cash < 10000) risks.push("Low cash balance.");
  if (margin != null && margin < 5) risks.push("Thin operating margin (<5%).");
  if (current != null && current < 1) risks.push("Current ratio below 1.0.");
  if (runway.runwayMonths != null && runway.runwayMonths < 6) {
    risks.push(`Cash runway under 6 months (${runway.runwayMonths.toFixed(1)}).`);
  }
  if (risks.length === 0) risks.push("No material liquidity/profitability risks flagged.");
  return Object.freeze(risks);
}
