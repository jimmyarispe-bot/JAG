"use client";

import type { InitiativeKpi } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function KPIProgress({
  kpis,
  className,
}: {
  kpis: InitiativeKpi[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {kpis.map((kpi) => {
        const pct =
          kpi.target === 0
            ? 0
            : Math.min(100, Math.round(((kpi.actual ?? 0) / kpi.target) * 100));
        return (
          <li key={kpi.id}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-800">{kpi.name}</span>
              <span className="text-slate-600">
                {kpi.actual ?? 0}/{kpi.target}
                {kpi.unit ? ` ${kpi.unit}` : ""}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
