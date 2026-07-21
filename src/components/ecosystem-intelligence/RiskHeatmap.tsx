"use client";

import { cn } from "@/components/workspace-design-system/utils";
import type { FederationRisk } from "@/lib/platform/intelligence/ecosystem-intelligence";

export function RiskHeatmap({
  risks,
  className,
}: {
  risks: FederationRisk[];
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold">Cross-organization risks</h3>
      <ul className="space-y-2 text-sm">
        {risks.length === 0 ? (
          <li className="text-muted-foreground">No cross-org risks detected.</li>
        ) : (
          risks.map((r) => (
            <li key={r.id}>
              <div className="font-medium">
                {r.title}{" "}
                <span className="text-muted-foreground">({r.severity})</span>
              </div>
              <p className="text-muted-foreground">{r.description}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
