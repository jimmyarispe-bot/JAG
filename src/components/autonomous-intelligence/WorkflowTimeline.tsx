"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { PlanTask } from "@/lib/platform/intelligence/executive-autonomous";
import { cn } from "@/components/workspace-design-system/utils";

export interface WorkflowTimelineProps {
  tasks: PlanTask[];
  className?: string;
  onAction?: (actionId: string, task: PlanTask) => void;
}

export function WorkflowTimeline({ tasks, className, onAction }: WorkflowTimelineProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-slate-900">Workflow timeline</h3>
      <ol className="relative space-y-4 border-l border-slate-200 pl-4">
        {tasks.map((task) => (
          <li key={task.id} className="relative">
            <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full bg-slate-400" />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500">
                  {task.estimatedDays}d · {task.ownerRole.replace(/_/g, " ")}
                </p>
                <h4 className="mt-1 text-sm font-semibold text-slate-900">{task.title}</h4>
                <p className="mt-1 text-sm text-slate-700">{task.description}</p>
              </div>
              <ActionChip
                size="sm"
                variant="secondary"
                onClick={() => onAction?.("open_task", task)}
              >
                Open
              </ActionChip>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
