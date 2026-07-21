"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { ConfidenceGauge } from "@/components/predictive-intelligence/ConfidenceGauge";
import type { ScenarioProjection } from "@/lib/platform/intelligence/executive-predictive";
import { cn } from "@/components/workspace-design-system/utils";

export interface ScenarioComparisonProps {
  scenarios: ScenarioProjection[];
  className?: string;
  onAction?: (actionId: string, scenario: ScenarioProjection) => void;
}

export function ScenarioComparison({
  scenarios,
  className,
  onAction,
}: ScenarioComparisonProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-slate-900">Scenario comparison</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <article
            key={scenario.id}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">{scenario.label}</h4>
              <span className="text-xs text-slate-500">
                P={Math.round(scenario.probability * 100)}%
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{scenario.narrative}</p>
            <p className="mt-2 text-xs text-slate-500">
              Outlook {(scenario.overallOutlook * 100).toFixed(0)}
            </p>
            <div className="mt-3">
              <ConfidenceGauge value={scenario.confidence} />
            </div>
            <div className="mt-3">
              <ActionChip
                size="sm"
                variant="secondary"
                onClick={() => onAction?.("inspect_scenario", scenario)}
              >
                Inspect
              </ActionChip>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
