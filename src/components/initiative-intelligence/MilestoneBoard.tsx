"use client";

import type { Milestone } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function MilestoneBoard({
  milestones,
  className,
}: {
  milestones: Milestone[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>
      {milestones.map((m) => (
        <section
          key={m.id}
          className="rounded-xl border border-slate-200 bg-white/80 p-3"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">{m.status}</p>
          <h4 className="mt-1 text-sm font-semibold text-slate-900">{m.title}</h4>
          <p className="mt-1 text-xs text-slate-600">
            {m.percentComplete}% · due {m.dueDate ?? "TBD"}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {m.workItems.slice(0, 4).map((w) => (
              <li key={w.id}>
                · {w.title} ({w.percentComplete}%)
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
