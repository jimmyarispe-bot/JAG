import { listTransactions } from "../../banking/store";
import {
  listExceptions,
  listMatches,
  listPeriods,
} from "../store";
import type { ReconciliationAnalytics } from "../types";

export function reconciliationAnalytics(
  organizationId: string
): ReconciliationAnalytics {
  const periods = listPeriods(organizationId);
  const openPeriods = periods.filter(
    (p) => p.status !== "closed"
  ).length;
  const closedPeriods = periods.filter((p) => p.status === "closed").length;

  const matchedBank = new Set(
    listMatches(organizationId)
      .filter((m) => m.status !== "rejected")
      .flatMap((m) => m.leftIds)
  );
  const outstandingTransactions = listTransactions(organizationId).filter(
    (t) => t.status !== "voided" && !matchedBank.has(t.id)
  ).length;

  const exceptions = listExceptions(organizationId);
  const openExceptions = exceptions.filter((e) => e.open);
  const now = Date.now();
  const aging = { "0-7": 0, "8-30": 0, "31+": 0 } as Record<
    "0-7" | "8-30" | "31+",
    number
  >;
  for (const e of openExceptions) {
    const days = (now - Date.parse(e.createdAt)) / (24 * 60 * 60 * 1000);
    if (days <= 7) aging["0-7"] += 1;
    else if (days <= 30) aging["8-30"] += 1;
    else aging["31+"] += 1;
  }

  const accepted = listMatches(organizationId).filter(
    (m) => m.status === "accepted" || m.status === "auto_accepted"
  );
  const auto = accepted.filter((m) => m.automatic).length;
  const autoMatchPercent =
    accepted.length === 0 ? 0 : (auto / accepted.length) * 100;
  const manualMatchPercent =
    accepted.length === 0 ? 0 : ((accepted.length - auto) / accepted.length) * 100;

  const completed = periods.filter(
    (p) => p.closedAt && p.openedAt
  );
  let averageCompletionHours: number | null = null;
  if (completed.length > 0) {
    const total = completed.reduce((s, p) => {
      return s + (Date.parse(p.closedAt!) - Date.parse(p.openedAt)) / 36e5;
    }, 0);
    averageCompletionHours = total / completed.length;
  }

  const statusCounts = new Map<string, number>();
  for (const p of periods) {
    statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);
  }

  return Object.freeze({
    organizationId,
    generatedAt: new Date().toISOString(),
    openPeriods,
    closedPeriods,
    outstandingTransactions,
    openExceptions: openExceptions.length,
    exceptionAgingDays: Object.freeze([
      Object.freeze({ bucket: "0-7" as const, count: aging["0-7"] }),
      Object.freeze({ bucket: "8-30" as const, count: aging["8-30"] }),
      Object.freeze({ bucket: "31+" as const, count: aging["31+"] }),
    ]),
    autoMatchPercent,
    manualMatchPercent,
    averageCompletionHours,
    byStatus: Object.freeze(
      [...statusCounts.entries()].map(([status, count]) =>
        Object.freeze({
          status: status as ReconciliationAnalytics["byStatus"][number]["status"],
          count,
        })
      )
    ),
  });
}
