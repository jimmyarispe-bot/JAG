"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { ConfidenceIndicator } from "@/components/decision-intelligence/ConfidenceIndicator";
import type { DecisionOption } from "@/lib/platform/intelligence/decision-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export interface DecisionIntelligenceCardProps {
  option: DecisionOption;
  className?: string;
  onAction?: (actionId: string, option: DecisionOption) => void;
}

export function DecisionIntelligenceCard({
  option,
  className,
  onAction,
}: DecisionIntelligenceCardProps) {
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
            Option #{option.rank}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{option.title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {option.scorecard.overall}/100
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{option.summary}</p>
      <p className="mt-2 text-xs text-slate-500">{option.whyRanked}</p>
      <div className="mt-3">
        <ConfidenceIndicator value={option.confidence} />
      </div>
      {option.policyFlags.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-amber-800">
          {option.policyFlags.map((f) => (
            <li key={f.id}>
              {f.severity}: {f.message}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionChip
          size="sm"
          variant="primary"
          onClick={() => onAction?.("select_option", option)}
        >
          Select option
        </ActionChip>
        <ActionChip
          size="sm"
          variant="secondary"
          onClick={() => onAction?.("view_evidence", option)}
        >
          View evidence
        </ActionChip>
        <ActionChip
          size="sm"
          variant="outline"
          onClick={() => onAction?.("schedule_review", option)}
        >
          Schedule review
        </ActionChip>
      </div>
    </article>
  );
}
