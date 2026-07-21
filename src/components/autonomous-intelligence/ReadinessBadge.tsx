"use client";

import type { ReadinessState } from "@/lib/platform/intelligence/executive-autonomous";
import { cn } from "@/components/workspace-design-system/utils";

const TONE: Record<ReadinessState, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  blocked: "bg-rose-100 text-rose-800",
  waiting_approval: "bg-amber-100 text-amber-900",
  waiting_resources: "bg-orange-100 text-orange-900",
  waiting_information: "bg-sky-100 text-sky-900",
  scheduled: "bg-slate-100 text-slate-800",
};

export interface ReadinessBadgeProps {
  state: ReadinessState;
  className?: string;
}

export function ReadinessBadge({ state, className }: ReadinessBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        TONE[state],
        className
      )}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}
