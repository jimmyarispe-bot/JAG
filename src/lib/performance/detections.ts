/**
 * Static detections from architecture + live probe measurements.
 */

import type { PerfDetection, PerfProbeReport } from "./types";

export function buildDetections(report: Omit<PerfProbeReport, "detections">): PerfDetection[] {
  const detections: PerfDetection[] = [];

  const coldIntel = report.comparisons.intelligenceColdMs;
  const lazyIntel = report.comparisons.intelligenceLazyColdMs;
  const warmIntel = report.comparisons.intelligenceWarmMs;
  // Residual: first process still pays eager full-graph once; production uses lazy+singleton.
  if (coldIntel > 80 && warmIntel < 1 && lazyIntel > 30) {
    detections.push({
      id: "dup-intelligence-init",
      severity: "high",
      title: "Intelligence full-graph cold start still expensive",
      evidence: `Eager cold=${coldIntel}ms lazy shell=${lazyIntel}ms warm singleton=${warmIntel}ms. Process singleton + lazy stacks are active; residual cost is first-process materialisation.`,
      recommendation:
        "Keep lazy stacks default; prewarm only ECC hot stacks (oios/opportunity/wisdom) on singleton init.",
    });
  }

  const coldInt = report.comparisons.integrationsColdMs;
  const warmInt = report.comparisons.integrationsWarmMs;
  if (coldInt > 80 && warmInt < 1) {
    detections.push({
      id: "dup-integration-bootstrap",
      severity: "high",
      title: "Integration platform cold bootstrap (process recycle)",
      evidence: `Cold integrations bootstrap=${coldInt}ms vs warm=${warmInt}ms. Production reuses process singleton + shared registered platform; cold delta is first-process bootstrap only.`,
      recommendation:
        "Keep getIntegrationManagement singleton; share getOrCreateRegisteredIntegrationPlatform with org-platform.",
    });
  }

  const slowRoutes = report.routeTimings.filter((r) => r.totalMs > 200);
  for (const route of slowRoutes.slice(0, 5)) {
    detections.push({
      id: `slow-route-${route.route}`,
      severity: route.totalMs > 1000 ? "high" : "medium",
      title: `Slow ECC route: ${route.route}`,
      evidence: `total=${route.totalMs}ms (intelligence=${route.intelligenceMs}ms, integrations=${route.integrationsMs}ms, sync=${route.syncMs}ms, builds=${route.buildMs}ms)`,
      recommendation:
        "Prefer warm singletons, parallel independent builds, and avoid re-sync when stores already have live data.",
    });
  }

  if (report.routeInventory.appRouteFiles > 100) {
    detections.push({
      id: "large-route-surface",
      severity: "medium",
      title: "Large application route surface",
      evidence: `${report.routeInventory.appRouteFiles} app route files detected. Large route graphs increase build time and navigation complexity.`,
      recommendation:
        "Treat performance as a first-class feature; lazy-load rarely used dashboards; keep ECC routes lean.",
    });
  }

  if (report.routeInventory.execClientComponents >= 4) {
    detections.push({
      id: "exec-client-bundles",
      severity: "medium",
      title: "Large client components under Executive Command Center",
      evidence: `${report.routeInventory.execClientComponents} client components in components/exec (Opportunity/Wisdom/Integrations pages are full client trees).`,
      recommendation:
        "Convert filter/tab shells to small client islands; keep page bodies as Server Components.",
    });
  }

  detections.push({
    id: "sequential-domain-builds",
    severity: "medium",
    title: "Sequential intelligence domain builds on Home/Brief",
    evidence:
      "loadExecHome builds oios → wisdom → opportunity. Opportunity does not depend on oios; sequential awaits add latency.",
    recommendation: "Promise.all independent builds (oios + opportunity), then wisdom with oiosResult.",
  });

  detections.push({
    id: "exec-layout-auth-waterfall",
    severity: "medium",
    title: "Exec layout identity resolution waterfall",
    evidence:
      "exec/layout awaits getAuthUser+getSessionUser, then getIdentityContext (extra Supabase queries), then org platform resolution before children render.",
    recommendation:
      "Keep parallel auth where possible; cache identity; measure org resolution separately (see probe orgResolutionMs).",
  });

  detections.push({
    id: "p002-middleware-auth-only",
    severity: "low",
    title: "Middleware authenticates; RSC authorizes (P002)",
    evidence:
      "Edge middleware verifies session only; catalog authorization runs once via getIdentityContext / requireAuthorizedRoute in layouts.",
    recommendation:
      "Keep request-scoped caches warm; do not reintroduce loadAuthzSnapshot in middleware.",
  });

  return detections;
}
