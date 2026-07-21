"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { CopilotCompareItem } from "@/lib/platform/intelligence/executive-copilot";
import { cn } from "@/components/workspace-design-system/utils";

export interface RecommendationCardProps {
  item: CopilotCompareItem;
  className?: string;
  onAction?: (actionId: string, item: CopilotCompareItem) => void;
}

export function RecommendationCard({
  item,
  className,
  onAction,
}: RecommendationCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
        {item.score != null ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
            {item.score}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-700">{item.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionChip
          size="sm"
          variant="primary"
          onClick={() => onAction?.("select_recommendation", item)}
        >
          Select
        </ActionChip>
        <ActionChip
          size="sm"
          variant="secondary"
          onClick={() => onAction?.("prepare_plan", item)}
        >
          Prepare plan
        </ActionChip>
      </div>
    </article>
  );
}
