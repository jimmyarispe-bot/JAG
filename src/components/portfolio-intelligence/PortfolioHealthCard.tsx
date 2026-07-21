"use client";

import type { PortfolioHealth } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function PortfolioHealthCard({
  health,
  className,
}: {
  health: PortfolioHealth;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white/80 p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Portfolio health
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {health.state.replace(/_/g, " ")} · {health.value}
      </p>
      <p className="mt-2 text-sm text-slate-600">{health.explainability}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
        <div>Budget {health.budgetPerformance}</div>
        <div>Schedule {health.schedulePerformance}</div>
        <div>Risk {health.riskIndex}</div>
        <div>Capacity {health.capacityUtilization}</div>
        <div>Completion {health.completionRate}%</div>
        <div>Coverage {health.strategicCoverage}</div>
      </dl>
    </div>
  );
}
