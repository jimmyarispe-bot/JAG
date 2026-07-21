/**
 * RC-3.05 HR ECC widgets — Turnover, Hiring, Capacity, Payroll,
 * Compensation trends, Succession readiness. Soft-read only.
 */

import { computeHrSignals } from "@/lib/platform/integrations/connectors/hr/intelligence/signals";
import { hrStore } from "@/lib/platform/integrations/connectors/hr/services/store";

export type HrTurnoverWidget = {
  kind: "hr_turnover";
  title: string;
  turnoverRate: number;
  terminations12m: number;
  headcount: number;
};

export type HrHiringWidget = {
  kind: "hr_hiring";
  title: string;
  openRoles: number;
  hiringVelocity: number;
};

export type HrCapacityWidget = {
  kind: "hr_capacity";
  title: string;
  capacityGapFte: number;
  timeOffPendingHours: number;
  headcount: number;
};

export type HrPayrollWidget = {
  kind: "hr_payroll";
  title: string;
  payrollTotalLatest: number;
  payrollTrendPct: number;
};

export type HrCompensationWidget = {
  kind: "hr_compensation";
  title: string;
  avgCompensation: number;
  compensationSpread: number;
};

export type HrSuccessionWidget = {
  kind: "hr_succession";
  title: string;
  successionReadyManagers: number;
  successionCoveragePct: number;
};

export type HrEccWidgets = {
  turnover: HrTurnoverWidget;
  hiring: HrHiringWidget;
  capacity: HrCapacityWidget;
  payroll: HrPayrollWidget;
  compensation: HrCompensationWidget;
  succession: HrSuccessionWidget;
  /** Compatibility with enterprise workforce projector */
  workforce: {
    kind: "workforce";
    title: string;
    headcount: number;
    openRoles: number;
  };
};

export function buildHrEccWidgets(organizationId: string): HrEccWidgets | null {
  const records = hrStore.allRecords(organizationId);
  if (!records.length) return null;
  const s = computeHrSignals(records);

  return {
    turnover: {
      kind: "hr_turnover",
      title: "Turnover",
      turnoverRate: s.turnoverRate,
      terminations12m: s.terminations12m,
      headcount: s.headcount,
    },
    hiring: {
      kind: "hr_hiring",
      title: "Hiring",
      openRoles: s.openRoles,
      hiringVelocity: s.hiringVelocity,
    },
    capacity: {
      kind: "hr_capacity",
      title: "Capacity",
      capacityGapFte: s.capacityGapFte,
      timeOffPendingHours: s.timeOffPendingHours,
      headcount: s.headcount,
    },
    payroll: {
      kind: "hr_payroll",
      title: "Payroll",
      payrollTotalLatest: s.payrollTotalLatest,
      payrollTrendPct: s.payrollTrendPct,
    },
    compensation: {
      kind: "hr_compensation",
      title: "Compensation trends",
      avgCompensation: s.avgCompensation,
      compensationSpread: s.compensationSpread,
    },
    succession: {
      kind: "hr_succession",
      title: "Succession readiness",
      successionReadyManagers: s.successionReadyManagers,
      successionCoveragePct: s.successionCoveragePct,
    },
    workforce: {
      kind: "workforce",
      title: "Workforce",
      headcount: s.headcount,
      openRoles: s.openRoles,
    },
  };
}
