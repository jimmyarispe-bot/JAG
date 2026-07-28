import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { evaluateMetrics, metricValue } from "../metrics";
import { listInsights, upsertInsight } from "../store";
import type { CfoInsight } from "../types";

export function generateInsights(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): readonly CfoInsight[] {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const insights: CfoInsight[] = [];

  const push = (
    kind: CfoInsight["kind"],
    title: string,
    detail: string,
    metricKey: CfoInsight["metricKey"]
  ) => {
    const i = upsertInsight({
      id: newId("cins"),
      organizationId: input.organizationId,
      kind,
      title,
      detail,
      metricKey,
      evidenceRefs: metricKey
        ? Object.freeze([
            {
              recordType: "metric",
              recordId: metricKey,
            },
          ])
        : Object.freeze([]),
      generatedAt: nowIso(),
    });
    publishCfoEvent({
      type: "cfo.insight_generated",
      organizationId: input.organizationId,
      recordType: "cfo_insight",
      recordId: i.id,
      actorUserId: input.userId,
      payload: { kind, title },
    });
    insights.push(i);
  };

  const margin = metricValue(snap, "operating_margin");
  const revenue = metricValue(snap, "revenue") ?? 0;
  const ebitda = metricValue(snap, "ebitda") ?? 0;
  const cash = metricValue(snap, "cash") ?? 0;

  if (margin != null && margin > 10) {
    push(
      "positive_trend",
      "Healthy operating margin",
      `Operating margin is ${margin.toFixed(1)}%.`,
      "operating_margin"
    );
  } else if (margin != null && margin < 0) {
    push(
      "negative_trend",
      "Negative operating margin",
      `Operating margin is ${margin.toFixed(1)}%.`,
      "operating_margin"
    );
  }

  if (ebitda < 0) {
    push(
      "emerging_risk",
      "Negative EBITDA",
      "EBITDA below zero for the period — review cost structure.",
      "ebitda"
    );
  } else if (ebitda > 0 && revenue > 0) {
    push(
      "emerging_opportunity",
      "Positive EBITDA base",
      `EBITDA ${ebitda.toFixed(0)} provides room for reinvestment.`,
      "ebitda"
    );
  }

  if (cash === 0 && revenue > 0) {
    push(
      "anomaly",
      "Revenue without treasury cash balance",
      "Ledger shows revenue but treasury cash hint is zero — verify bank sync.",
      "cash"
    );
  }

  if (insights.length === 0) {
    push(
      "outlier",
      "Limited signal set",
      "Insufficient variance vs prior periods for trend classification.",
      null
    );
  }

  return Object.freeze(insights);
}

export { listInsights };
