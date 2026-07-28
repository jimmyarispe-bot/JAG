/**
 * In-process ops trend / last dashboard store (tests + API GET).
 */

import type { MonitoringReport, OperationsDashboard } from "./types";

const g = globalThis as typeof globalThis & {
  __jagAcademyOsOpsDashboard?: OperationsDashboard | null;
  __jagAcademyOsOpsMonitorTrend?: MonitoringReport["trend"];
};

export function resetOperationsStoreForTests(): void {
  g.__jagAcademyOsOpsDashboard = null;
  g.__jagAcademyOsOpsMonitorTrend = [];
}

export function setLastOperationsDashboard(
  dash: OperationsDashboard
): OperationsDashboard {
  g.__jagAcademyOsOpsDashboard = dash;
  return dash;
}

export function getLastOperationsDashboard(): OperationsDashboard | null {
  return g.__jagAcademyOsOpsDashboard ?? null;
}

export function appendMonitorTrend(
  point: MonitoringReport["trend"][number]
): readonly MonitoringReport["trend"][number][] {
  if (!g.__jagAcademyOsOpsMonitorTrend) g.__jagAcademyOsOpsMonitorTrend = [];
  const last = g.__jagAcademyOsOpsMonitorTrend.at(-1);
  if (
    !last ||
    last.errorRate !== point.errorRate ||
    last.apiLatencyMs !== point.apiLatencyMs
  ) {
    g.__jagAcademyOsOpsMonitorTrend.push(point);
    if (g.__jagAcademyOsOpsMonitorTrend.length > 40) {
      g.__jagAcademyOsOpsMonitorTrend.splice(
        0,
        g.__jagAcademyOsOpsMonitorTrend.length - 40
      );
    }
  }
  return g.__jagAcademyOsOpsMonitorTrend;
}

export function getMonitorTrend(): readonly MonitoringReport["trend"][number][] {
  return g.__jagAcademyOsOpsMonitorTrend ?? [];
}
