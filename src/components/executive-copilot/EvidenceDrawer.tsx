"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { CopilotExplainability } from "@/lib/platform/intelligence/executive-copilot";
import { cn } from "@/components/workspace-design-system/utils";

export interface EvidenceDrawerProps {
  explainability: CopilotExplainability;
  className?: string;
  onAction?: (actionId: string) => void;
}

export function EvidenceDrawer({
  explainability,
  className,
  onAction,
}: EvidenceDrawerProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Evidence</h3>
          <p className="mt-1 text-sm text-slate-700">{explainability.executiveSummary}</p>
        </div>
        <ActionChip size="sm" variant="outline" onClick={() => onAction?.("copy_evidence")}>
          Copy
        </ActionChip>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Confidence {Math.round(explainability.confidence * 100)}%
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
        {explainability.supportingEvidence.map((e) => (
          <li key={e.id}>
            <span className="text-xs uppercase tracking-wide text-slate-500">{e.domain}</span>
            <span className="mx-1">·</span>
            {e.statement}
          </li>
        ))}
      </ul>
      {explainability.knownUncertainties.length > 0 ? (
        <div className="mt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Uncertainties
          </h4>
          <ul className="mt-1 space-y-1 text-sm text-amber-900">
            {explainability.knownUncertainties.map((u) => (
              <li key={u}>• {u}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
