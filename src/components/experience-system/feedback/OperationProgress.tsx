"use client";

import { cn } from "@/components/workspace-design-system/utils";

export type OperationProgressProps = {
  /** Visible when true or when value is set. */
  active?: boolean;
  label: string;
  /** 0–100 determinate progress. Omit for indeterminate bar. */
  value?: number;
  /** Optional ETA / speed / remaining copy (uploads, imports). */
  detail?: string;
  className?: string;
};

/**
 * UX-004 — long-running operation indicator (>2s / bulk / AI / import-export).
 * Prefer pairing with `useActionFeedback` + `useGlobalProgress().setProgress`.
 */
export function OperationProgress({
  active = true,
  label,
  value,
  detail,
  className,
}: OperationProgressProps) {
  if (!active) return null;
  const determinate = typeof value === "number" && Number.isFinite(value);
  const pct = determinate ? Math.max(0, Math.min(100, Math.round(value))) : undefined;

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
          aria-hidden
        />
        <span className="font-medium">{label}</span>
        {pct != null ? <span className="ml-auto tabular-nums text-xs text-slate-500">{pct}%</span> : null}
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        {determinate ? (
          <div
            className="h-full bg-brand-500 transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-pulse bg-brand-400/80" />
        )}
      </div>
      {detail ? <p className="mt-1.5 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}
