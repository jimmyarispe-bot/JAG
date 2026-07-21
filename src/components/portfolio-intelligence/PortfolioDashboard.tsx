"use client";

import { CapacityPlanner } from "@/components/portfolio-intelligence/CapacityPlanner";
import { DependencyGraph } from "@/components/portfolio-intelligence/DependencyGraph";
import { PortfolioHealthCard } from "@/components/portfolio-intelligence/PortfolioHealthCard";
import { PortfolioMap } from "@/components/portfolio-intelligence/PortfolioMap";
import { PrioritizationMatrix } from "@/components/portfolio-intelligence/PrioritizationMatrix";
import { ResourceHeatmap } from "@/components/portfolio-intelligence/ResourceHeatmap";
import { RoadmapTimeline } from "@/components/portfolio-intelligence/RoadmapTimeline";
import { ScenarioComparison } from "@/components/portfolio-intelligence/ScenarioComparison";
import type { PortfolioResult } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function PortfolioDashboard({
  result,
  className,
}: {
  result: PortfolioResult;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Portfolio Intelligence
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          Enterprise strategic portfolio
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {result.explainability.executiveSummary}
        </p>
      </header>

      <PortfolioHealthCard health={result.health} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Portfolio map</h2>
          <PortfolioMap registry={result.registry} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Capacity</h2>
          <CapacityPlanner capacity={result.capacity} />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Priority matrix</h2>
        <PrioritizationMatrix items={result.prioritization} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Resource allocation</h2>
        <ResourceHeatmap allocations={result.allocations} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Roadmap</h2>
          <RoadmapTimeline roadmap={result.roadmap} />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Dependencies</h2>
          <DependencyGraph dependencies={result.dependencies} />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Scenarios</h2>
        <ScenarioComparison scenarios={result.scenarios} />
      </section>
    </div>
  );
}
