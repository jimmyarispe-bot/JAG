import { listForecasts } from "@finance";
import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { evaluateMetrics, metricValue } from "../metrics";
import { listRunway, upsertRunway } from "../store";
import type { CashRunwayReport, RunwayScenario } from "../types";

function months(cash: number, burn: number): number | null {
  if (burn <= 0) return null;
  return cash / burn;
}

export function computeRunway(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
  /** Override monthly burn; otherwise derived from expenses / 12 or forecast. */
  monthlyBurn?: number;
}): CashRunwayReport {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const currentCash = metricValue(snap, "cash") ?? 0;
  const availableCash = currentCash;
  const expenses = Math.abs(
    (metricValue(snap, "operating_income") ?? 0) -
      (metricValue(snap, "revenue") ?? 0)
  );
  const forecasts = listForecasts(input.organizationId).filter(
    (f) => f.method === "cash_placeholder" || f.periodKey === input.periodKey
  );
  const forecastBurn =
    forecasts[0]?.lines.reduce((s, l) => s + Math.abs(l.amount), 0) ??
    expenses / 12;
  const monthlyBurn = input.monthlyBurn ?? Math.max(forecastBurn, expenses / 12);

  const sensitivity = Object.freeze({
    best_case: Object.freeze({
      burn: monthlyBurn * 0.8,
      runwayMonths: months(availableCash, monthlyBurn * 0.8),
    }),
    expected: Object.freeze({
      burn: monthlyBurn,
      runwayMonths: months(availableCash, monthlyBurn),
    }),
    worst_case: Object.freeze({
      burn: monthlyBurn * 1.25,
      runwayMonths: months(availableCash, monthlyBurn * 1.25),
    }),
  } satisfies Record<
    RunwayScenario,
    { burn: number; runwayMonths: number | null }
  >);

  const report = upsertRunway({
    id: newId("runway"),
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    currentCash,
    availableCash,
    monthlyBurn,
    forecastBurn,
    runwayMonths: months(availableCash, monthlyBurn),
    sensitivity,
    generatedAt: nowIso(),
  });

  publishCfoEvent({
    type: "cfo.runway_computed",
    organizationId: input.organizationId,
    recordType: "cash_runway",
    recordId: report.id,
    actorUserId: input.userId,
    payload: {
      runwayMonths: report.runwayMonths,
      monthlyBurn: report.monthlyBurn,
      currentCash: report.currentCash,
    },
  });
  return report;
}

export { listRunway };
