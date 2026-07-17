/**
 * Static detections from architecture + live probe measurements.
 */

import type { PerfDetection, PerfProbeReport } from "./types";

export function buildDetections(report: Omit<PerfProbeReport, "detections">): PerfDetection[] {
  const detections: PerfDetection[] = [];

  const coldIntel = report.comparisons.intelligenceColdMs;
  const warmIntel = report.comparisons.intelligenceWarmMs;
  if (coldIntel > 50 && warmIntel < coldIntel * 0.5) {
    detections.push({
      id: "dup-intelligence-init",
      severity: "critical",
      title: "Duplicate intelligence initialization (per-request DI)",
      evidence: `Cold createIntelligenceService=${coldIntel}ms vs warm singleton=${warmIntel}ms. Without a process singleton, every ECC navigation rebuilds the 39-module graph.`,
      recommendation:
        "Use process-level singleton for getExecIntelligence (React cache() alone is per-request).",
    });
  }

  const coldInt = report.comparisons.integrationsColdMs;
  const warmInt = report.comparisons.integrationsWarmMs;
  if (coldInt > 40 && warmInt < coldInt * 0.5) {
    detections.push({
      id: "dup-integration-bootstrap",
      severity: "critical",
      title: "Repeated integration platform creation + sequential bootstrap",
      evidence: `Cold integrations bootstrap=${coldInt}ms vs warm=${warmInt}ms. Phase-1 path bootstraps 10 connectors sequentially on every fresh platform instance.`,
      recommendation:
        "Process-level singleton for getIntegrationManagement; keep connector stores warm.",
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
    id: "middleware-not-on-exec",
    severity: "low",
    title: "Middleware excludes /exec (auth deferred to layout)",
    evidence:
      "middleware matcher covers /admin,/dashboard,/api but not /exec — layout pays full auth cost on first byte.",
    recommendation:
      "Optional: add /exec to middleware for early reject, or accept layout-only auth and optimize identity queries.",
  });

  return detections;
}
