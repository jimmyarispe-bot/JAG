/**
 * KPI framework for initiative measurement.
 */

import type { InitiativeKpi } from "@/lib/platform/intelligence/initiative-intelligence/types";

export function buildDefaultKpis(
  createId: (prefix: string) => string,
  title: string
): InitiativeKpi[] {
  return [
    {
      id: createId("kpi-primary"),
      name: `${title} primary metric`,
      unit: "score",
      baseline: 0,
      target: 100,
      actual: 0,
      weight: 0.6,
    },
    {
      id: createId("kpi-secondary"),
      name: `${title} secondary metric`,
      unit: "pct",
      baseline: 0,
      target: 80,
      actual: 0,
      weight: 0.4,
    },
  ];
}

export function scoreKpiAchievement(kpis: InitiativeKpi[]): number {
  if (kpis.length === 0) return 0;
  let weighted = 0;
  let weightSum = 0;
  for (const kpi of kpis) {
    const w = kpi.weight ?? 1;
    weightSum += w;
    if (kpi.target === 0) {
      weighted += (kpi.actual ?? 0) > 0 ? w : 0;
      continue;
    }
    const ratio = Math.min(1, Math.max(0, (kpi.actual ?? 0) / kpi.target));
    weighted += ratio * w;
  }
  return weightSum === 0 ? 0 : Math.round((weighted / weightSum) * 100);
}
