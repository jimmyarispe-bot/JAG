"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { BriefingCard } from "@/lib/platform/intelligence/briefing";
import { cn } from "@/components/workspace-design-system/utils";

const KIND_STYLES: Record<string, string> = {
  risk: "border-rose-200 bg-rose-50/40",
  opportunity: "border-emerald-200 bg-emerald-50/40",
  decision: "border-amber-200 bg-amber-50/40",
  alert: "border-orange-200 bg-orange-50/50",
  metric: "border-slate-200 bg-white",
  summary: "border-slate-200 bg-white",
  focus: "border-sky-200 bg-sky-50/40",
  action: "border-violet-200 bg-violet-50/30",
};

export interface BriefCardProps {
  card: BriefingCard;
  className?: string;
  showExplainability?: boolean;
  onAction?: (actionId: string, card: BriefingCard) => void;
}

export function BriefCard({
  card,
  className,
  showExplainability = true,
  onAction,
}: BriefCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        KIND_STYLES[card.kind] ?? KIND_STYLES.summary,
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {card.kind}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{card.title}</h3>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>Priority {card.priorityScore}</div>
          <div>Confidence {card.confidence}</div>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-700">{card.summary}</p>
      {card.domains.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Domains: {card.domains.join(", ")}
        </p>
      ) : null}
      {showExplainability ? (
        <details className="mt-3 text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-800">
            Why am I seeing this?
          </summary>
          <p className="mt-2">{card.explainability.why}</p>
          {card.explainability.supportingEvidence?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {card.explainability.supportingEvidence.slice(0, 4).map((ev, i) => (
                <li key={ev.id ?? i}>
                  {ev.domain ? <strong>{ev.domain}: </strong> : null}
                  {ev.statement}
                </li>
              ))}
            </ul>
          ) : null}
        </details>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {card.actions.map((action) =>
          action.href ? (
            <ActionChip
              key={action.id}
              href={action.href}
              size="sm"
              variant={action.variant ?? "secondary"}
            >
              {action.label}
            </ActionChip>
          ) : (
            <ActionChip
              key={action.id}
              size="sm"
              variant={action.variant ?? "secondary"}
              onClick={() => onAction?.(action.id, card)}
            >
              {action.label}
            </ActionChip>
          )
        )}
      </div>
    </article>
  );
}
