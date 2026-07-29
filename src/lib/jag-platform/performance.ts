/**
 * Performance notes & helpers for GA readiness.
 * Phase 1 stores are process-local; SQL indexes live in migrations 203–209.
 */

export type PerformanceFinding = {
  readonly area: string;
  readonly severity: "info" | "low" | "medium";
  readonly finding: string;
  readonly mitigation: string;
};

export const JAG_PERFORMANCE_FINDINGS: readonly PerformanceFinding[] =
  Object.freeze([
    {
      area: "Evidence uploads",
      severity: "info",
      finding:
        "Upload path is in-memory; no N+1 against Postgres in portal Phase 1.",
      mitigation:
        "When moving to SQL persistence, batch insert document + version + graph node.",
    },
    {
      area: "Processing pipeline",
      severity: "low",
      finding: "Jobs run synchronously in-process after upload.",
      mitigation:
        "Acceptable for GA pilot volume; queue worker planned post-GA.",
    },
    {
      area: "Knowledge Graph rendering",
      severity: "low",
      finding: "SVG layout is O(n) client-side; suitable for hundreds of nodes.",
      mitigation: "Add server-side pagination/filter before large-tenant GA.",
    },
    {
      area: "Dashboard / health aggregation",
      severity: "medium",
      finding:
        "Health snapshot iterates known orgs and recomputes pipeline metrics.",
      mitigation:
        "Cache snapshot for 15–30s in production; org id set is small for GA.",
    },
    {
      area: "QuickBooks sync",
      severity: "info",
      finding: "Five reports imported sequentially per sync.",
      mitigation: "Parallelize report fetch post-GA if latency becomes an issue.",
    },
    {
      area: "SQL indexes",
      severity: "info",
      finding:
        "Org-scoped indexes exist on evidence, connectors, KG (203–208); 209 adds composite helpers.",
      mitigation: "Keep organization_id leading columns on all tenant tables.",
    },
  ]);
