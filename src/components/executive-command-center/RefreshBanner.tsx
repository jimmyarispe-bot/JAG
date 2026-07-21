"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { CommandCenterResult } from "@/lib/platform/intelligence/executive-command-center";
import { cn } from "@/components/workspace-design-system/utils";

export interface RefreshBannerProps {
  result: CommandCenterResult;
  className?: string;
  onRefresh?: () => void;
}

export function RefreshBanner({ result, className, onRefresh }: RefreshBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600",
        className
      )}
    >
      <p>
        Refreshed from {result.refresh.source} at {result.refresh.refreshedAt} ·{" "}
        {result.refresh.contributingDomains.length} domains
      </p>
      <ActionChip size="sm" variant="outline" onClick={() => onRefresh?.()}>
        Refresh workspace
      </ActionChip>
    </div>
  );
}
