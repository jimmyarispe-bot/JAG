"use client";

import type { DecisionOption } from "@/lib/platform/intelligence/decision-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export interface TradeoffViewProps {
  option: DecisionOption;
  className?: string;
}

export function TradeoffView({ option, className }: TradeoffViewProps) {
  return (
    <div className={cn("space-y-3 text-sm text-slate-700", className)}>
      <div>
        <h4 className="font-medium text-slate-900">Trade-offs</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {option.tradeOffs.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {option.scenarios.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s.label} · {Math.round(s.probability * 100)}%
            </p>
            <p className="mt-1">{s.narrative}</p>
            <p className="mt-2 text-xs text-slate-500">Impact {s.impactScore}/100</p>
          </div>
        ))}
      </div>
    </div>
  );
}
