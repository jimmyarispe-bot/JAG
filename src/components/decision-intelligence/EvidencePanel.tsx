"use client";

import type { DecisionEvidence } from "@/lib/platform/intelligence/decision-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export interface EvidencePanelProps {
  evidence: DecisionEvidence[];
  className?: string;
}

export function EvidencePanel({ evidence, className }: EvidencePanelProps) {
  if (!evidence.length) {
    return (
      <p className={cn("text-sm text-slate-500", className)}>No evidence attached.</p>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {evidence.map((item) => (
        <li
          key={item.id}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            item.supporting
              ? "border-emerald-200 bg-emerald-50/50 text-slate-800"
              : "border-rose-200 bg-rose-50/50 text-slate-800"
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.supporting ? "Supporting" : "Contradictory"}
            {item.source ? ` · ${item.source}` : ""}
            {item.domain ? ` · ${item.domain}` : ""}
          </p>
          <p className="mt-1">{item.statement}</p>
        </li>
      ))}
    </ul>
  );
}
