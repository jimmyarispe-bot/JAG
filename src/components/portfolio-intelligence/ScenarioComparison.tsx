"use client";

import type { PortfolioScenario } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function ScenarioComparison({
  scenarios,
  className,
}: {
  scenarios: PortfolioScenario[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      {scenarios.map((s) => (
        <section
          key={s.kind + s.label}
          className="rounded-xl border border-slate-200 bg-white/80 p-3"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">{s.kind}</p>
          <h4 className="mt-1 text-sm font-semibold text-slate-900">{s.label}</h4>
          <p className="mt-1 text-xs text-slate-600">{s.narrative}</p>
          <p className="mt-2 text-xs text-slate-700">
            Health {s.projectedHealth} · ROI {s.projectedRoi} · budget ×{s.budgetMultiplier} ·
            capacity ×{s.capacityMultiplier}
          </p>
        </section>
      ))}
    </div>
  );
}
