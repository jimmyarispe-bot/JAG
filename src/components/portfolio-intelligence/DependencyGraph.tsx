"use client";

import type { CrossInitiativeDependency } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function DependencyGraph({
  dependencies,
  className,
}: {
  dependencies: CrossInitiativeDependency[];
  className?: string;
}) {
  if (dependencies.length === 0) {
    return <p className={cn("text-sm text-slate-500", className)}>No cross-initiative dependencies.</p>;
  }
  return (
    <ul className={cn("space-y-2 text-sm", className)}>
      {dependencies.map((d) => (
        <li key={d.id} className="rounded-lg border border-slate-100 px-3 py-2">
          <span className="font-medium text-slate-900">{d.kind}</span>
          <span className="text-slate-600"> · {d.label}</span>
          <span className="text-xs text-slate-500"> · sev {d.severity}</span>
        </li>
      ))}
    </ul>
  );
}
