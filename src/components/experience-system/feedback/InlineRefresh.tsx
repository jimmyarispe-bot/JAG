"use client";

import { cn } from "@/components/workspace-design-system/utils";

/**
 * UX-004 — dashboard / widget refresh indicator (never full-page).
 */
export function InlineRefresh({
  active,
  label = "Refreshing…",
  className,
}: {
  active: boolean;
  label?: string;
  className?: string;
}) {
  if (!active) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-slate-500",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"
        aria-hidden
      />
      {label}
    </span>
  );
}
