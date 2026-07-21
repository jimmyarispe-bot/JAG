"use client";

import type { Initiative } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function InitiativeTimeline({
  initiative,
  className,
}: {
  initiative: Initiative;
  className?: string;
}) {
  return (
    <ol className={cn("space-y-3 border-l border-slate-200 pl-4", className)}>
      {initiative.transitions.map((t) => (
        <li key={t.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-500" />
          <p className="text-xs text-slate-500">{t.at}</p>
          <p className="text-sm font-medium text-slate-900">
            {t.from ?? "∅"} → {t.to} · {t.byRole}
          </p>
          {t.rationale ? <p className="text-sm text-slate-600">{t.rationale}</p> : null}
        </li>
      ))}
    </ol>
  );
}
