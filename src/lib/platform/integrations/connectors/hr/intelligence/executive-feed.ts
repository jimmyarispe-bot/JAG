import { computeHrSignals } from "@/lib/platform/integrations/connectors/hr/intelligence/signals";
import { hrStore } from "@/lib/platform/integrations/connectors/hr/services/store";

export type HrExecutiveFeed = {
  sourceSystem: "hr";
  live: true;
  organizationId: string;
  syncedAt: string;
  providersConnected: string[];
  briefBullets: string[];
  signals: ReturnType<typeof computeHrSignals>;
};

export function buildHrExecutiveFeed(organizationId: string): HrExecutiveFeed | null {
  const snapshots = hrStore.listForOrganization(organizationId);
  const records = hrStore.allRecords(organizationId);
  if (!records.length) return null;

  const signals = computeHrSignals(records);
  const syncedAt =
    snapshots.map((s) => s.syncedAt).filter(Boolean).sort().at(-1) ??
    new Date().toISOString();

  const briefBullets = [
    `Headcount ${signals.headcount} · turnover ${signals.turnoverRate}% (${signals.terminations12m} exits).`,
    `${signals.openRoles} open roles · capacity gap ${signals.capacityGapFte} FTE.`,
    `Payroll $${Math.round(signals.payrollTotalLatest).toLocaleString()} (${signals.payrollTrendPct >= 0 ? "+" : ""}${signals.payrollTrendPct}% vs prior).`,
    `Avg compensation $${signals.avgCompensation.toLocaleString()} · succession coverage ${signals.successionCoveragePct}%.`,
  ];

  return {
    sourceSystem: "hr",
    live: true,
    organizationId,
    syncedAt,
    providersConnected: snapshots.map((s) => s.provider),
    briefBullets,
    signals,
  };
}

export function getHrExecutiveFeed(organizationId: string): HrExecutiveFeed | null {
  return buildHrExecutiveFeed(organizationId);
}
