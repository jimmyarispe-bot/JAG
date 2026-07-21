"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { RollbackPlan } from "@/lib/platform/intelligence/executive-autonomous";
import { cn } from "@/components/workspace-design-system/utils";

export interface RollbackPanelProps {
  rollback: RollbackPlan;
  className?: string;
  onAction?: (actionId: string) => void;
}

export function RollbackPanel({ rollback, className, onAction }: RollbackPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Rollback plan</h3>
        <ActionChip size="sm" variant="outline" onClick={() => onAction?.("copy_rollback")}>
          Copy
        </ActionChip>
      </div>
      <p className="mt-2 text-sm text-slate-700">{rollback.impactAssessment}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Conditions
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {rollback.conditions.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recovery
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {rollback.recoverySteps.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notify
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {rollback.notifications.map((c) => (
              <li key={c}>• {c.replace(/_/g, " ")}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
