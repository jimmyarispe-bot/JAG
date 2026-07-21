"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { OrganizationalForecast } from "@/lib/platform/intelligence/executive-predictive";
import { cn } from "@/components/workspace-design-system/utils";

export interface TrendProjectionProps {
  forecast: OrganizationalForecast;
  className?: string;
  onAction?: (actionId: string, forecast: OrganizationalForecast) => void;
}

export function TrendProjection({
  forecast,
  className,
  onAction,
}: TrendProjectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Trend · {forecast.subject.replace(/_/g, " ")}
        </h3>
        <ActionChip
          size="sm"
          variant="outline"
          onClick={() => onAction?.("export_projection", forecast)}
        >
          Export
        </ActionChip>
      </div>
      <ol className="mt-3 space-y-2">
        {forecast.points.map((point) => (
          <li
            key={point.horizon}
            className="flex items-center justify-between text-sm text-slate-700"
          >
            <span>{point.horizon}</span>
            <span className="font-medium text-slate-900">
              {point.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
              {point.unit}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
