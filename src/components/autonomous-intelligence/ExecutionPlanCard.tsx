"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import { ReadinessBadge } from "@/components/autonomous-intelligence/ReadinessBadge";
import type { ExecutionPlan } from "@/lib/platform/intelligence/executive-autonomous";
import { cn } from "@/components/workspace-design-system/utils";

export interface ExecutionPlanCardProps {
  plan: ExecutionPlan;
  className?: string;
  onAction?: (actionId: string, plan: ExecutionPlan) => void;
}

export function ExecutionPlanCard({ plan, className, onAction }: ExecutionPlanCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {plan.workflowKind} · {plan.estimatedDurationDays}d
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{plan.optionTitle}</h3>
        </div>
        <ReadinessBadge state={plan.readiness} />
      </div>
      <p className="mt-2 text-sm text-slate-700">{plan.objective}</p>
      <p className="mt-2 text-xs text-slate-500">
        {plan.tasks.length} tasks · {plan.requiredApprovals.length} approvals · human authorization
        required
      </p>
      {plan.readinessReasons[0] ? (
        <p className="mt-2 text-xs text-slate-600">{plan.readinessReasons[0]}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionChip
          size="sm"
          variant="primary"
          onClick={() => onAction?.("review_plan", plan)}
        >
          Review plan
        </ActionChip>
        <ActionChip
          size="sm"
          variant="secondary"
          onClick={() => onAction?.("view_approvals", plan)}
        >
          Approvals
        </ActionChip>
        <ActionChip
          size="sm"
          variant="outline"
          onClick={() => onAction?.("view_rollback", plan)}
        >
          Rollback
        </ActionChip>
      </div>
    </article>
  );
}
