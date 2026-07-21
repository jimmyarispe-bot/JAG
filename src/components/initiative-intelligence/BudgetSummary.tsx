"use client";

import type { InitiativeBudget } from "@/lib/platform/intelligence/initiative-intelligence";
import { budgetVariance } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function BudgetSummary({
  budget,
  className,
}: {
  budget: InitiativeBudget;
  className?: string;
}) {
  const v = budgetVariance(budget);
  return (
    <div className={cn("grid grid-cols-3 gap-3 text-sm", className)}>
      <div>
        <p className="text-xs uppercase text-slate-500">Planned</p>
        <p className="font-semibold text-slate-900">{budget.planned.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500">Actual</p>
        <p className="font-semibold text-slate-900">{budget.actual.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500">Variance</p>
        <p className="font-semibold text-slate-900">
          {v.absolute.toLocaleString()} ({v.pct}%)
        </p>
      </div>
    </div>
  );
}
