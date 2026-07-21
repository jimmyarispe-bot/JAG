"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { ApprovalStep } from "@/lib/platform/intelligence/executive-autonomous";
import { cn } from "@/components/workspace-design-system/utils";

export interface ApprovalQueueProps {
  approvals: ApprovalStep[];
  className?: string;
  onAction?: (actionId: string, step: ApprovalStep) => void;
}

export function ApprovalQueue({ approvals, className, onAction }: ApprovalQueueProps) {
  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-slate-900">Approval queue</h3>
      {pending.length === 0 ? (
        <p className="text-sm text-slate-500">No pending role approvals.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((step) => (
            <li
              key={step.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {step.role.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-slate-500">{step.rationale}</p>
              </div>
              <ActionChip
                size="sm"
                variant="secondary"
                onClick={() => onAction?.("open_approval", step)}
              >
                Open
              </ActionChip>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
