"use client";

import type { InitiativeRisk } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function RiskPanel({
  risks,
  className,
}: {
  risks: InitiativeRisk[];
  className?: string;
}) {
  if (risks.length === 0) {
    return <p className={cn("text-sm text-slate-500", className)}>No open risks.</p>;
  }
  return (
    <ul className={cn("space-y-2", className)}>
      {risks.map((risk) => (
        <li
          key={risk.id}
          className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
        >
          <div className="flex justify-between gap-2">
            <span className="font-medium text-slate-900">{risk.title}</span>
            <span className="text-xs text-slate-600">
              S{risk.severity}/L{risk.likelihood}
              {risk.escalationRequired ? " · escalate" : ""}
            </span>
          </div>
          <p className="mt-1 text-slate-600">{risk.summary}</p>
        </li>
      ))}
    </ul>
  );
}
