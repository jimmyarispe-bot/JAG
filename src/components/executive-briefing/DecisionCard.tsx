"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { DecisionCard as DecisionCardModel } from "@/lib/platform/intelligence/briefing";
import { cn } from "@/components/workspace-design-system/utils";

export interface DecisionCardProps {
  card: DecisionCardModel;
  className?: string;
  onAction?: (actionId: string, card: DecisionCardModel) => void;
}

export function DecisionCard({ card, className, onAction }: DecisionCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
        Decision needed
      </p>
      <h3 className="mt-1 text-base font-semibold text-slate-900">{card.decisionNeeded}</h3>
      <dl className="mt-3 space-y-2 text-sm text-slate-700">
        <div>
          <dt className="font-medium text-slate-900">Why</dt>
          <dd>{card.why}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Impact if delayed</dt>
          <dd>{card.impactIfDelayed}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Recommended decision</dt>
          <dd>{card.recommendedDecision}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Confidence</dt>
          <dd>{card.confidence}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-900">Supporting domains</dt>
          <dd>{card.domains.join(", ") || "synthesis"}</dd>
        </div>
      </dl>
      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-800">
          Why am I seeing this?
        </summary>
        <p className="mt-2">{card.explainability.why}</p>
      </details>
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
