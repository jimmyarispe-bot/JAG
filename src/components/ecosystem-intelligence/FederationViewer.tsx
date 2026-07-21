"use client";

import { cn } from "@/components/workspace-design-system/utils";
import type { EcosystemFederationResult } from "@/lib/platform/intelligence/ecosystem-intelligence";

export function FederationViewer({
  result,
  className,
}: {
  result: EcosystemFederationResult;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold">Federation governance</h3>
      <p className="text-sm text-muted-foreground">
        {result.federation.agreementCount} active agreement(s) · audit{" "}
        {result.auditLog.length} event(s)
      </p>
      <ul className="max-h-48 space-y-1 overflow-auto text-xs text-muted-foreground">
        {result.auditLog.slice(0, 12).map((entry, idx) => (
          <li key={`${entry.action}-${idx}`}>
            {entry.allowed ? "allow" : "deny"} · {entry.action}
            {entry.targetOrganizationId ? ` · ${entry.targetOrganizationId}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
