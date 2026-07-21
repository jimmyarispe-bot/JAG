"use client";

import { cn } from "@/components/workspace-design-system/utils";
import type { EcosystemFederationModel } from "@/lib/platform/intelligence/ecosystem-intelligence";

export function GeographicCoverage({
  coverage,
  className,
}: {
  coverage: EcosystemFederationModel["geographicCoverage"];
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold">Geographic coverage</h3>
      <ul className="space-y-2 text-sm">
        {coverage.map((g) => (
          <li key={g.region} className="flex justify-between gap-2">
            <span className="font-medium">{g.region}</span>
            <span className="text-muted-foreground">
              {g.organizationIds.length} org(s) · enrollment {g.enrollmentIndex}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
