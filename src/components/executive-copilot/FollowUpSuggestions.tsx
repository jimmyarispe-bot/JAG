"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { CopilotFollowUp } from "@/lib/platform/intelligence/executive-copilot";
import { cn } from "@/components/workspace-design-system/utils";

export interface FollowUpSuggestionsProps {
  followUps: CopilotFollowUp[];
  className?: string;
  onSelect?: (followUp: CopilotFollowUp) => void;
}

export function FollowUpSuggestions({
  followUps,
  className,
  onSelect,
}: FollowUpSuggestionsProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-slate-900">Suggested follow-ups</h3>
      <div className="flex flex-wrap gap-2">
        {followUps.map((f) => (
          <ActionChip
            key={f.id}
            size="sm"
            variant="outline"
            onClick={() => onSelect?.(f)}
          >
            {f.prompt}
          </ActionChip>
        ))}
      </div>
    </section>
  );
}
