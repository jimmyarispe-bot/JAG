"use client";

import { cn } from "@/components/workspace-design-system/utils";

export interface ConfidenceGaugeProps {
  /** 0–1 or 0–100 */
  value: number;
  className?: string;
  label?: string;
}

export function ConfidenceGauge({
  value,
  className,
  label = "Confidence",
}: ConfidenceGaugeProps) {
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);
  const clamped = Math.max(0, Math.min(100, pct));
  const tone =
    clamped >= 70 ? "bg-emerald-500" : clamped >= 45 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-medium text-slate-900">{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
