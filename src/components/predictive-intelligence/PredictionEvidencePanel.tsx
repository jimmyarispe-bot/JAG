"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { ConfidenceGauge } from "@/components/predictive-intelligence/ConfidenceGauge";
import type { PredictionExplainability } from "@/lib/platform/intelligence/executive-predictive";
import { cn } from "@/components/workspace-design-system/utils";

export interface PredictionEvidencePanelProps {
  explainability: PredictionExplainability;
  className?: string;
  onAction?: (actionId: string) => void;
}

export function PredictionEvidencePanel({
  explainability,
  className,
  onAction,
}: PredictionEvidencePanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Prediction evidence</h3>
          <p className="mt-2 text-sm text-slate-700">{explainability.why}</p>
        </div>
        <ActionChip
          size="sm"
          variant="outline"
          onClick={() => onAction?.("copy_explainability")}
        >
          Copy
        </ActionChip>
      </div>
      <div className="mt-3">
        <ConfidenceGauge value={explainability.confidence} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{explainability.confidenceGuidance}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Historical evidence
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {explainability.historicalEvidence.map((e) => (
              <li key={e.id}>• {e.statement}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current signals
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {explainability.currentSignals.length === 0 ? (
              <li className="text-slate-500">None attached</li>
            ) : (
              explainability.currentSignals.map((e) => <li key={e.id}>• {e.statement}</li>)
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          What could invalidate this
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {explainability.invalidatingAssumptions.map((a, i) => (
            <li key={`${i}-${a.slice(0, 24)}`}>• {a}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
