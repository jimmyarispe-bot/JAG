/**
 * Thin adapters over existing observability health surfaces — no new product APIs.
 */

export type HealthProbe = {
  name: string;
  path: string;
  purpose: string;
};

/** Documented production health probes (routes already shipped in RC-1). */
const PRODUCTION_HEALTH_PROBES: HealthProbe[] = [
  {
    name: "liveness",
    path: "/api/health",
    purpose: "Process liveness for load balancers",
  },
  {
    name: "readiness",
    path: "/api/ready",
    purpose: "Dependency readiness before traffic",
  },
  {
    name: "deep_ready",
    path: "/api/ready/deep",
    purpose: "Deep dependency probe for ops",
  },
  {
    name: "metrics",
    path: "/api/observability/metrics",
    purpose: "Metrics scrape / export",
  },
  {
    name: "alerts",
    path: "/api/observability/alerts",
    purpose: "Alert feed",
  },
  {
    name: "rum",
    path: "/api/observability/rum",
    purpose: "Real-user monitoring ingest",
  },
];

export function listProductionHealthProbes(): HealthProbe[] {
  return [...PRODUCTION_HEALTH_PROBES];
}
