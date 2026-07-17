/**
 * Performance Phase 1 — measurement types (no business logic).
 */

export type PerfSpan = {
  name: string;
  durationMs: number;
  startMs: number;
  endMs: number;
  meta?: Record<string, unknown>;
};

export type PerfTrace = {
  id: string;
  route: string;
  label: string;
  startedAt: string;
  totalMs: number;
  spans: PerfSpan[];
  cache: {
    hits: number;
    misses: number;
  };
  flags: {
    intelligenceColdStart: boolean;
    integrationsColdStart: boolean;
  };
};

export type PerfDetection = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  evidence: string;
  recommendation: string;
};

export type RouteTimingRow = {
  route: string;
  label: string;
  totalMs: number;
  intelligenceMs: number;
  integrationsMs: number;
  syncMs: number;
  buildMs: number;
  orgResolutionMs: number;
  cacheHits: number;
  cacheMisses: number;
};

export type BundleReportRow = {
  area: string;
  clientComponentCount: number;
  serverComponentHint: string;
  notes: string;
};

export type PerfProbeReport = {
  generatedAt: string;
  processUptimeMs: number;
  routeTimings: RouteTimingRow[];
  detections: PerfDetection[];
  bundle: BundleReportRow[];
  routeInventory: {
    appRouteFiles: number;
    execRoutes: number;
    execClientComponents: number;
    execServerComponents: number;
  };
  singletons: {
    intelligenceInitialized: boolean;
    integrationsInitialized: boolean;
    intelligenceInitMs: number | null;
    integrationsInitMs: number | null;
  };
  comparisons: {
    intelligenceColdMs: number;
    intelligenceWarmMs: number;
    integrationsColdMs: number;
    integrationsWarmMs: number;
  };
};
