"use client";

import type { PortfolioRegistry } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function PortfolioMap({
  registry,
  className,
}: {
  registry: PortfolioRegistry;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-semibold text-slate-900">{registry.name}</p>
      <div className="flex flex-wrap gap-2">
        {registry.themes.map((t) => (
          <span
            key={t.id}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {t.name}
          </span>
        ))}
      </div>
      <ul className="space-y-2 text-sm">
        {registry.programs.map((p) => (
          <li key={p.id} className="rounded-lg border border-slate-100 px-3 py-2">
            <span className="font-medium text-slate-900">{p.name}</span>
            <span className="text-slate-500">
              {" "}
              · {p.initiativeIds.length} initiative(s)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
