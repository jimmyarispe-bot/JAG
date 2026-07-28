import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { evaluateMetrics, metricValue } from "../metrics";
import {
  listAdjustments,
  listEbitda,
  upsertAdjustment,
  upsertEbitda,
} from "../store";
import type {
  EbitdaAdjustment,
  EbitdaAdjustmentKind,
  EbitdaReport,
} from "../types";

export function recordEbitdaAdjustment(input: {
  organizationId: string;
  userId: string;
  kind: EbitdaAdjustmentKind;
  label: string;
  amount: number;
  periodKey: string;
  rationale: string;
  evidenceRefs?: readonly { recordType: string; recordId: string }[];
}): EbitdaAdjustment {
  const adj = upsertAdjustment({
    id: newId("ebadj"),
    organizationId: input.organizationId,
    kind: input.kind,
    label: input.label,
    amount: input.amount,
    periodKey: input.periodKey,
    rationale: input.rationale,
    createdBy: input.userId,
    createdAt: nowIso(),
    evidenceRefs: Object.freeze([...(input.evidenceRefs ?? [])]),
  });
  publishCfoEvent({
    type: "cfo.adjustment_recorded",
    organizationId: input.organizationId,
    recordType: "ebitda_adjustment",
    recordId: adj.id,
    actorUserId: input.userId,
    payload: { kind: adj.kind, amount: adj.amount, periodKey: adj.periodKey },
  });
  return adj;
}

export function computeEbitda(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): EbitdaReport {
  const adjustments = listAdjustments(input.organizationId, input.periodKey);
  const adjustmentTotal = adjustments.reduce((s, a) => s + a.amount, 0);
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    adjustmentTotal,
  });
  const operatingIncome = metricValue(snap, "operating_income") ?? 0;
  const ebitda = metricValue(snap, "ebitda") ?? 0;
  const adjustedEbitda = metricValue(snap, "adjusted_ebitda") ?? 0;
  const recurring = adjustments
    .filter((a) => a.kind === "recurring")
    .reduce((s, a) => s + a.amount, 0);
  const normalizedEbitda = ebitda + recurring;

  const depAdj = adjustments
    .filter((a) => a.kind === "depreciation")
    .reduce((s, a) => s + a.amount, 0);
  const amortAdj = adjustments
    .filter((a) => a.kind === "amortization")
    .reduce((s, a) => s + a.amount, 0);
  const depreciation = Math.max(0, ebitda - operatingIncome - amortAdj) + depAdj;
  const amortization = amortAdj;

  const report = upsertEbitda({
    id: newId("ebitda"),
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    ebitda,
    adjustedEbitda,
    normalizedEbitda,
    operatingIncome,
    depreciation,
    amortization,
    adjustments,
    generatedAt: nowIso(),
    sourceRefs: snap.metrics.ebitda.sourceRefs,
  });

  publishCfoEvent({
    type: "cfo.ebitda_computed",
    organizationId: input.organizationId,
    recordType: "ebitda_report",
    recordId: report.id,
    actorUserId: input.userId,
    payload: {
      ebitda: report.ebitda,
      adjustedEbitda: report.adjustedEbitda,
      normalizedEbitda: report.normalizedEbitda,
    },
  });
  return report;
}

export { listEbitda, listAdjustments };
