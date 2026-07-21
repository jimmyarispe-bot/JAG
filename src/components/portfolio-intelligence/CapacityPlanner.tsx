"use client";

import type { CapacitySnapshot } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function CapacityPlanner({
  capacity,
  className,
}: {
  capacity: CapacitySnapshot;
  className?: string;
}) {
  const rows = [
    ["Budget", capacity.budgetUtilization],
    ["Staff", capacity.staffUtilization],
    ["Leadership", capacity.leadershipAttention],
    ["Operations", capacity.operationalBandwidth],
    ["Time", capacity.timePressure],
  ] as const;

  return (
    <div className={cn("space-y-3", className)}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-800">{label}</span>
            <span className="text-slate-600">{value}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-700"
              style={{ width: `${Math.min(100, value)}%` }}
            />
          </div>
        </div>
      ))}
      {capacity.bottlenecks.length > 0 ? (
        <p className="text-xs text-slate-600">
          Bottlenecks: {capacity.bottlenecks.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
