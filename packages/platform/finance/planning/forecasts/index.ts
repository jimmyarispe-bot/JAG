import { newId, nowIso } from "../../ids";
import { publishOperationalFinanceEvent } from "../../operations/events";
import { listForecasts, upsertForecast } from "../store";
import type { Forecast, ForecastMethod } from "../types";

export function createForecast(input: {
  organizationId: string;
  userId: string;
  name: string;
  method: ForecastMethod;
  periodKey: string;
  lines: readonly {
    label: string;
    amount: number;
    accountId?: string | null;
  }[];
  scenarioId?: string | null;
}): Forecast {
  const prior = listForecasts(input.organizationId).filter(
    (f) => f.name === input.name && f.periodKey === input.periodKey
  );
  const version = prior.reduce((m, f) => Math.max(m, f.version), 0) + 1;
  const cashPlaceholder = input.method === "cash_placeholder";
  const forecast = upsertForecast({
    id: newId("fcst"),
    organizationId: input.organizationId,
    name: input.name,
    method: input.method,
    periodKey: input.periodKey,
    version,
    lines: Object.freeze(
      input.lines.map((l) =>
        Object.freeze({
          label: l.label,
          amount: l.amount,
          accountId: l.accountId ?? null,
        })
      )
    ),
    scenarioId: input.scenarioId ?? null,
    cashPlaceholder,
    createdAt: nowIso(),
    createdBy: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.forecast_created",
    organizationId: input.organizationId,
    recordType: "forecast",
    recordId: forecast.id,
    actorUserId: input.userId,
    payload: {
      method: forecast.method,
      version: forecast.version,
      cashPlaceholder: forecast.cashPlaceholder,
    },
  });
  return forecast;
}

export { listForecasts };
