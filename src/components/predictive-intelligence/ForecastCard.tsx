"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { ConfidenceGauge } from "@/components/predictive-intelligence/ConfidenceGauge";
import type { OrganizationalForecast } from "@/lib/platform/intelligence/executive-predictive";
import { cn } from "@/components/workspace-design-system/utils";

export interface ForecastCardProps {
  forecast: OrganizationalForecast;
  className?: string;
  onAction?: (actionId: string, forecast: OrganizationalForecast) => void;
}

export function ForecastCard({ forecast, className, onAction }: ForecastCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {forecast.subject.replace(/_/g, " ")} · {forecast.horizon}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            {forecast.projectedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            <span className="text-sm font-normal text-slate-500">{forecast.unit}</span>
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {forecast.direction}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">
        Δ {forecast.delta.toLocaleString(undefined, { maximumFractionDigits: 2 })} from baseline{" "}
        {forecast.baselineValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      <div className="mt-3">
        <ConfidenceGauge value={forecast.confidence} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionChip
          size="sm"
          variant="primary"
          onClick={() => onAction?.("view_explainability", forecast)}
        >
          Why this forecast
        </ActionChip>
        <ActionChip
          size="sm"
          variant="secondary"
          onClick={() => onAction?.("compare_scenarios", forecast)}
        >
          Compare scenarios
        </ActionChip>
        <ActionChip
          size="sm"
          variant="outline"
          onClick={() => onAction?.("monitor_drift", forecast)}
        >
          Monitor drift
        </ActionChip>
      </div>
    </article>
  );
}
