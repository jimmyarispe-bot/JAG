"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { PriorityScorecard } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function PrioritizationMatrix({
  items,
  className,
}: {
  items: PriorityScorecard[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((p) => (
        <div
          key={p.initiativeId}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">
              #{p.rank} {p.title}
            </p>
            <p className="text-xs text-slate-600">{p.explainability}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{p.composite}</span>
            <ActionChip size="sm" variant="outline">
              Compare
            </ActionChip>
          </div>
        </div>
      ))}
    </div>
  );
}
