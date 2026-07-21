"use client";

import { BudgetSummary } from "@/components/initiative-intelligence/BudgetSummary";
import { DependencyGraph } from "@/components/initiative-intelligence/DependencyGraph";
import { InitiativeCard } from "@/components/initiative-intelligence/InitiativeCard";
import { InitiativeTimeline } from "@/components/initiative-intelligence/InitiativeTimeline";
import { KPIProgress } from "@/components/initiative-intelligence/KPIProgress";
import { MilestoneBoard } from "@/components/initiative-intelligence/MilestoneBoard";
import { OutcomeSummary } from "@/components/initiative-intelligence/OutcomeSummary";
import { RiskPanel } from "@/components/initiative-intelligence/RiskPanel";
import type { InitiativeResult } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export interface InitiativeDashboardProps {
  result: InitiativeResult;
  className?: string;
  selectedId?: string;
}

export function InitiativeDashboard({
  result,
  className,
  selectedId,
}: InitiativeDashboardProps) {
  const selected =
    result.initiatives.find((i) => i.id === selectedId) ?? result.initiatives[0];

  return (
    <div className={cn("space-y-6", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Initiative Intelligence
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Strategic execution portfolio
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {result.explainability.executiveSummary}
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Portfolio {result.portfolioHealth.label} ({result.portfolioHealth.value})
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        {result.initiatives.map((initiative) => (
          <InitiativeCard key={initiative.id} initiative={initiative} />
        ))}
      </div>

      {selected ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
          <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
          <MilestoneBoard milestones={selected.milestones} />
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">KPIs</h3>
              <KPIProgress kpis={selected.kpis} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Budget</h3>
              <BudgetSummary budget={selected.budget} />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Risks</h3>
              <RiskPanel risks={selected.risks} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Dependencies & links</h3>
              <DependencyGraph initiative={selected} />
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Lifecycle</h3>
            <InitiativeTimeline initiative={selected} />
          </div>
          {selected.outcome ? <OutcomeSummary outcome={selected.outcome} /> : null}
        </div>
      ) : null}
    </div>
  );
}
