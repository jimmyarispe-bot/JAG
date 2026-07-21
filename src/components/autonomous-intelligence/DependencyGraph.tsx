"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { PlanPrerequisite } from "@/lib/platform/intelligence/executive-autonomous";
import { cn } from "@/components/workspace-design-system/utils";

export interface DependencyGraphProps {
  dependencies: PlanPrerequisite[];
  className?: string;
  onAction?: (actionId: string, dep: PlanPrerequisite) => void;
}

export function DependencyGraph({
  dependencies,
  className,
  onAction,
}: DependencyGraphProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Dependencies</h3>
        <ActionChip size="sm" variant="outline" onClick={() => onAction?.("refresh", dependencies[0])}>
          Refresh
        </ActionChip>
      </div>
      <ul className="space-y-2">
        {dependencies.map((dep) => (
          <li
            key={dep.id}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              dep.satisfied
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : dep.blocking
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-slate-200 bg-white text-slate-800"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{dep.label}</span>
              <span className="text-xs uppercase tracking-wide">
                {dep.satisfied ? "met" : dep.kind}
              </span>
            </div>
            {dep.detail ? <p className="mt-1 text-xs opacity-80">{dep.detail}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
