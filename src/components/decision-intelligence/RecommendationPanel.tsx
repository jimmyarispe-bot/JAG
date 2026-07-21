"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { ConfidenceIndicator } from "@/components/decision-intelligence/ConfidenceIndicator";
import { EvidencePanel } from "@/components/decision-intelligence/EvidencePanel";
import { OptionComparisonTable } from "@/components/decision-intelligence/OptionComparisonTable";
import { TradeoffView } from "@/components/decision-intelligence/TradeoffView";
import type { DecisionRecommendation } from "@/lib/platform/intelligence/decision-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export interface RecommendationPanelProps {
  recommendation: DecisionRecommendation;
  className?: string;
  onAction?: (actionId: string) => void;
}

export function RecommendationPanel({
  recommendation,
  className,
  onAction,
}: RecommendationPanelProps) {
  const top =
    recommendation.rankedOptions.find((o) => o.id === recommendation.recommendedOptionId) ??
    recommendation.rankedOptions[0];

  return (
    <section className={cn("space-y-6", className)}>
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Decision Intelligence
        </p>
        <h2 className="text-xl font-semibold text-slate-900">{recommendation.issue.title}</h2>
        <p className="text-sm text-slate-700">{recommendation.executiveSummary}</p>
        <ConfidenceIndicator value={recommendation.confidence} />
      </header>

      {top ? <TradeoffView option={top} /> : null}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Option comparison</h3>
        <OptionComparisonTable options={recommendation.rankedOptions} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Evidence</h3>
        <EvidencePanel evidence={recommendation.evidence} />
      </div>

      <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700">
        <summary className="cursor-pointer font-medium text-slate-900">
          Why is this recommended?
        </summary>
        <p className="mt-2">{recommendation.explainability.why}</p>
        <p className="mt-2 text-xs text-slate-500">
          Domains: {recommendation.explainability.contributingDomains.join(", ") || "n/a"}
        </p>
      </details>

      <div className="flex flex-wrap gap-2">
        <ActionChip size="sm" variant="primary" onClick={() => onAction?.("accept_recommendation")}>
          {recommendation.suggestedNextStep.slice(0, 48)}
          {recommendation.suggestedNextStep.length > 48 ? "…" : ""}
        </ActionChip>
        <ActionChip size="sm" variant="secondary" onClick={() => onAction?.("open_investigation")}>
          Open investigation
        </ActionChip>
        <ActionChip size="sm" variant="outline" onClick={() => onAction?.("assign_owner")}>
          Assign owner
        </ActionChip>
      </div>
    </section>
  );
}
