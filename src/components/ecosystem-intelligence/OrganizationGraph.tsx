"use client";

import { cn } from "@/components/workspace-design-system/utils";
import type { EcosystemGraph } from "@/lib/platform/intelligence/ecosystem-intelligence";

export function OrganizationGraph({
  graph,
  className,
}: {
  graph: EcosystemGraph;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold">Organization network</h3>
      <ul className="space-y-2 text-sm">
        {graph.nodes.map((node) => (
          <li key={node.id} className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{node.displayName}</span>
            <span className="text-muted-foreground">
              {node.kind}
              {node.region ? ` · ${node.region}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {graph.relationships.length} relationship edge(s)
      </p>
    </section>
  );
}
