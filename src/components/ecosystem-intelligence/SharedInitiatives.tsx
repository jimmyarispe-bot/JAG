"use client";

import { cn } from "@/components/workspace-design-system/utils";
import type { FederatedOrgSummary } from "@/lib/platform/intelligence/ecosystem-intelligence";

export function SharedInitiatives({
  summaries,
  className,
}: {
  summaries: FederatedOrgSummary[];
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold">Federated initiatives</h3>
      <ul className="space-y-2 text-sm">
        {summaries.map((s) => (
          <li key={s.organizationId} className="flex justify-between gap-2">
            <span>{s.displayName}</span>
            <span className="text-muted-foreground">
              {s.initiatives?.active ?? 0} active · {s.initiatives?.atRisk ?? 0} at risk
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
