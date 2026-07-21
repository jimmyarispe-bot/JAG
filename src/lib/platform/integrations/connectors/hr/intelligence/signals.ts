/**
 * RC-3.05 HR intelligence signals from canonical entities only.
 */

import type { HrCanonicalEntity } from "@/lib/platform/integrations/connectors/hr/entities";

function num(v: unknown): number {
  return Number(v ?? 0);
}

export type HrIntelligenceSignals = {
  headcount: number;
  terminations12m: number;
  turnoverRate: number;
  openRoles: number;
  hiringVelocity: number;
  capacityGapFte: number;
  timeOffPendingHours: number;
  payrollTotalLatest: number;
  payrollTrendPct: number;
  avgCompensation: number;
  compensationSpread: number;
  successionReadyManagers: number;
  successionCoveragePct: number;
  departments: number;
};

export function computeHrSignals(
  records: readonly HrCanonicalEntity[]
): HrIntelligenceSignals {
  const employees = records.filter((r) => r.objectType === "employee");
  const active = employees.filter((e) => String(e.attributes.status) !== "terminated");
  const terminated = employees.filter((e) => String(e.attributes.status) === "terminated");
  const hiring = records.filter((r) => r.objectType === "hiring");
  const openRoles = hiring.filter((h) => String(h.attributes.status) === "open");
  const timeOff = records.filter(
    (r) => r.objectType === "time_off" || r.objectType === "pto"
  );
  const payroll = records.filter((r) => r.objectType === "payroll");
  const managers = records.filter((r) => r.objectType === "manager");
  const departments = records.filter((r) => r.objectType === "department");

  const headcount = active.length;
  const terminations12m = terminated.length;
  const turnoverRate =
    headcount + terminations12m > 0
      ? Math.round((terminations12m / (headcount + terminations12m)) * 1000) / 10
      : 0;

  const pendingHours = timeOff.reduce((s, t) => s + num(t.attributes.pendingHours), 0);
  const capacityGapFte =
    openRoles.reduce((s, h) => s + num(h.attributes.requisitions), 0) +
    Math.round((pendingHours / 40) * 10) / 10;

  const byPeriod = new Map<string, number>();
  for (const row of payroll) {
    const period = String(row.attributes.period ?? "unknown");
    byPeriod.set(period, (byPeriod.get(period) ?? 0) + num(row.attributes.totalAmt));
  }
  const periods = [...byPeriod.keys()].sort();
  const latest = periods.length ? byPeriod.get(periods[periods.length - 1]!) ?? 0 : 0;
  const prior =
    periods.length > 1 ? byPeriod.get(periods[periods.length - 2]!) ?? latest : latest;
  const payrollTrendPct =
    prior > 0 ? Math.round(((latest - prior) / prior) * 1000) / 10 : 0;

  const comps = active
    .map((e) => num(e.attributes.compensation))
    .filter((n) => n > 0);
  const avgCompensation = comps.length
    ? Math.round(comps.reduce((a, b) => a + b, 0) / comps.length)
    : 0;
  const compensationSpread = comps.length
    ? Math.max(...comps) - Math.min(...comps)
    : 0;

  const successionReadyManagers = managers.filter((m) =>
    Boolean(m.attributes.successionReady)
  ).length;
  const successionCoveragePct = managers.length
    ? Math.round((successionReadyManagers / managers.length) * 1000) / 10
    : 0;

  return {
    headcount,
    terminations12m,
    turnoverRate,
    openRoles: openRoles.length,
    hiringVelocity: openRoles.length,
    capacityGapFte,
    timeOffPendingHours: pendingHours,
    payrollTotalLatest: latest,
    payrollTrendPct,
    avgCompensation,
    compensationSpread,
    successionReadyManagers,
    successionCoveragePct,
    departments: departments.length,
  };
}
