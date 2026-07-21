"use client";

import type { InitiativeOutcomeMeasurement } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function OutcomeSummary({
  outcome,
  className,
}: {
  outcome: InitiativeOutcomeMeasurement;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 text-sm", className)}>
      <div>
        <p className="text-xs uppercase text-slate-500">KPI results</p>
        <ul className="mt-1 space-y-1">
          {outcome.kpiResults.map((k) => (
            <li key={k.kpiId}>
              {k.name}: {k.actual}/{k.target} {k.met ? "✓" : "· missed"}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500">Lessons</p>
        <ul className="mt-1 list-disc pl-5 text-slate-700">
          {outcome.lessonsLearned.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
      {outcome.persistedToMemory ? (
        <p className="text-xs font-medium text-emerald-700">Persisted to Executive Memory</p>
      ) : null}
    </div>
  );
}
