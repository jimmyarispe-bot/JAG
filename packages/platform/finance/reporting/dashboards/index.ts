import { newId, nowIso } from "../../ids";
import { publishOperationalFinanceEvent } from "../../operations/events";
import { buildExecutiveKpis } from "../executive-kpis";
import { generateStatement } from "../financial-statements";
import { upsertDashboard } from "../store";
import type { ReportingDashboard, StatementKind } from "../types";

const SUMMARY_KINDS: StatementKind[] = [
  "income_statement",
  "balance_sheet",
  "cash_flow",
];

export function buildReportingDashboard(input: {
  organizationId: string;
  userId: string;
  kind: ReportingDashboard["kind"];
  periodKey: string;
  scopeId?: string | null;
  customKpis?: Readonly<Record<string, number>>;
}): ReportingDashboard {
  const kpis = buildExecutiveKpis({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    custom: input.customKpis,
  });

  const statementSummaries = SUMMARY_KINDS.map((kind) => {
    const stmt = generateStatement({
      organizationId: input.organizationId,
      userId: input.userId,
      kind,
      periodKey: input.periodKey,
      scope:
        input.kind === "executive" || input.kind === "finance"
          ? "consolidated"
          : (input.kind as "department" | "program" | "campus" | "grant" | "project"),
      scopeId: input.scopeId,
    });
    const total =
      stmt.totals.netIncome ??
      stmt.totals.assets ??
      stmt.totals.netCashChange ??
      0;
    return Object.freeze({ kind, total });
  });

  const dashboard = upsertDashboard({
    id: newId("dash"),
    organizationId: input.organizationId,
    kind: input.kind,
    scopeId: input.scopeId ?? null,
    kpis,
    statementSummaries: Object.freeze(statementSummaries),
    drillDownReady: true,
    generatedAt: nowIso(),
  });

  publishOperationalFinanceEvent({
    type: "finance.dashboard_built",
    organizationId: input.organizationId,
    recordType: "reporting_dashboard",
    recordId: dashboard.id,
    actorUserId: input.userId,
    payload: { kind: dashboard.kind, periodKey: input.periodKey },
  });

  return dashboard;
}
