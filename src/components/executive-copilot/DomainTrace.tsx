"use client";

import type { DomainTraceEntry } from "@/lib/platform/intelligence/executive-copilot";
import { cn } from "@/components/workspace-design-system/utils";

export interface DomainTraceProps {
  trace: DomainTraceEntry[];
  className?: string;
}

export function DomainTrace({ trace, className }: DomainTraceProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-slate-900">Domain trace</h3>
      <ul className="space-y-1.5">
        {trace.map((entry) => (
          <li
            key={`${entry.domain}-${entry.reason}`}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs",
              entry.used
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-slate-50 text-slate-600"
            )}
          >
            <span className="font-medium">{entry.domain}</span>
            <span className="mx-1.5 text-slate-400">·</span>
            <span>{entry.used ? "used" : "missing"}</span>
            <p className="mt-0.5 opacity-80">{entry.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
