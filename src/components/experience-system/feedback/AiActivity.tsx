"use client";

import { useEffect, useState } from "react";
import { cn } from "@/components/workspace-design-system/utils";

const DEFAULT_PHASES = [
  "Thinking…",
  "Analyzing…",
  "Correlating…",
  "Evaluating…",
  "Forecasting…",
] as const;

export type AiActivityProps = {
  active: boolean;
  /** Rotating status lines while AI work is in flight. */
  phases?: readonly string[];
  /** Override single static label (disables rotation). */
  label?: string;
  className?: string;
  rotateMs?: number;
};

/**
 * UX-004 — never leave AI cards static during generation.
 */
export function AiActivity({
  active,
  phases = DEFAULT_PHASES,
  label,
  className,
  rotateMs = 1600,
}: AiActivityProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || label || phases.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phases.length);
    }, rotateMs);
    return () => clearInterval(id);
  }, [active, label, phases, rotateMs]);

  if (!active) return null;
  const text = label ?? phases[index] ?? "Thinking…";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 text-sm text-violet-900",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"
        aria-hidden
      />
      <span className="font-medium">{text}</span>
    </div>
  );
}

/** Mission Control / Exec brief activity strip. */
export function WorkspaceActivity({
  active,
  label,
  className,
}: {
  active: boolean;
  label: string;
  className?: string;
}) {
  if (!active) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs font-medium text-slate-600",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
        aria-hidden
      />
      {label}
    </div>
  );
}
