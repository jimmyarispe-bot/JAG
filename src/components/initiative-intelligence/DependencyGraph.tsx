"use client";

import type { Initiative } from "@/lib/platform/intelligence/initiative-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function DependencyGraph({
  initiative,
  className,
}: {
  initiative: Initiative;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2 text-sm", className)}>
      {initiative.milestones.map((m) => (
        <li key={m.id} className="rounded-lg border border-slate-100 px-3 py-2">
          <span className="font-medium text-slate-900">{m.title}</span>
          <span className="text-slate-500">
            {" "}
            depends on {m.dependsOn.length ? m.dependsOn.join(", ") : "—"}
          </span>
        </li>
      ))}
      {initiative.links.map((link) => (
        <li key={`${link.kind}-${link.refId}`} className="text-slate-600">
          {link.kind}: {link.label ?? link.refId}
          {link.domain ? ` (${link.domain})` : ""}
        </li>
      ))}
    </ul>
  );
}
