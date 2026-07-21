"use client";

import { cn } from "@/components/workspace-design-system/utils";
import type { FederationOpportunity } from "@/lib/platform/intelligence/ecosystem-intelligence";

export function OpportunityBoard({
  opportunities,
  className,
}: {
  opportunities: FederationOpportunity[];
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold">Shared opportunities</h3>
      <ul className="space-y-2 text-sm">
        {opportunities.length === 0 ? (
          <li className="text-muted-foreground">No shared opportunities.</li>
        ) : (
          opportunities.map((o) => (
            <li key={o.id}>
              <div className="font-medium">{o.title}</div>
              <p className="text-muted-foreground">
                {o.description} · impact {o.estimatedImpact.toFixed(2)} · advisory
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
