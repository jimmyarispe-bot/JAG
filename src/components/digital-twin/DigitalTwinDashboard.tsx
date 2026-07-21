"use client";

import { ConstraintViewer } from "@/components/digital-twin/ConstraintViewer";
import { ImpactMatrix } from "@/components/digital-twin/ImpactMatrix";
import { ScenarioBuilder } from "@/components/digital-twin/ScenarioBuilder";
import { ScenarioComparison } from "@/components/digital-twin/ScenarioComparison";
import { SimulationResults } from "@/components/digital-twin/SimulationResults";
import { TradeoffAnalysis } from "@/components/digital-twin/TradeoffAnalysis";
import type { TwinResult } from "@/lib/platform/intelligence/digital-twin";
import { cn } from "@/components/workspace-design-system/utils";

export function DigitalTwinDashboard({
  result,
  className,
}: {
  result: TwinResult;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Organizational Digital Twin
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Strategic sandbox</h1>
          <p className="mt-1 text-sm text-slate-600">
            {result.explainability.executiveSummary}
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Confidence {Math.round(result.explainability.confidence * 100)}% · advisory
        </div>
      </header>

      <ScenarioBuilder scenarios={result.scenarios} />
      <SimulationResults simulations={result.simulations} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ScenarioComparison comparisons={result.comparisons} />
        <TradeoffAnalysis recommendation={result.recommendation} />
      </div>
      <ImpactMatrix simulations={result.simulations} />
      <ConstraintViewer simulations={result.simulations} />
    </div>
  );
}
