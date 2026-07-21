"use client";

import { cn } from "@/components/workspace-design-system/utils";
import type { EcosystemFederationResult } from "@/lib/platform/intelligence/ecosystem-intelligence";

export function EcosystemMap({
  result,
  className,
}: {
  result: EcosystemFederationResult;
  className?: string;
}) {
  const health = result.model.metrics.find((m) => m.key === "ecosystem_health");
  return (
    <section className={cn("space-y-3", className)}>
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Ecosystem map</h2>
        <p className="text-sm text-muted-foreground">
          {result.explainability.executiveSummary}
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Authorized</dt>
          <dd className="font-medium">{result.federation.authorizedCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Excluded</dt>
          <dd className="font-medium">{result.federation.excludedCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Health</dt>
          <dd className="font-medium">{Math.round(health?.value ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Confidence</dt>
          <dd className="font-medium">
            {Math.round(result.explainability.confidence * 100)}%
          </dd>
        </div>
      </dl>
    </section>
  );
}
