/** Cash position helpers — reads Treasury via metric registry. */

import { evaluateMetrics, metricValue } from "../metrics";

export function currentCashPosition(input: {
  organizationId: string;
  periodKey: string;
}): { cash: number; workingCapital: number | null } {
  const snap = evaluateMetrics(input);
  return {
    cash: metricValue(snap, "cash") ?? 0,
    workingCapital: metricValue(snap, "working_capital"),
  };
}
