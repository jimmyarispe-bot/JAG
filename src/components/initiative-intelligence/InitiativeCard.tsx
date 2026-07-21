"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { Initiative } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export interface InitiativeCardProps {
  initiative: Initiative;
  className?: string;
  onOpen?: (initiative: Initiative) => void;
}

export function InitiativeCard({ initiative, className, onOpen }: InitiativeCardProps) {
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
            {initiative.state.replace(/_/g, " ")} · {initiative.progress.healthStatus}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{initiative.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{initiative.executiveSummary}</p>
        </div>
        <span className="text-sm font-semibold text-slate-700">
          {initiative.progress.percentComplete}%
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionChip size="sm" variant="primary" onClick={() => onOpen?.(initiative)}>
          Open Investigation
        </ActionChip>
        <ActionChip size="sm" variant="outline">
          View Evidence
        </ActionChip>
        <ActionChip size="sm" variant="outline">
          Assign
        </ActionChip>
      </div>
    </article>
  );
}
