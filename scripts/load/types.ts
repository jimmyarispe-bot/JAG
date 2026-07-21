/**
 * RC-2 — load / resilience test types.
 */

export type Percentiles = {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
  min: number;
};

export type ScenarioResult = {
  id: string;
  name: string;
  domain: string;
  path: string;
  concurrency: number;
  durationMs: number;
  requests: number;
  throughputRps: number;
  errorRate: number;
  latency: Percentiles;
  statusCounts: Record<string, number>;
  notes?: string[];
};

export type ResourceSample = {
  at: string;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  cpuUserMs: number;
  cpuSystemMs: number;
  eventLoopLagMs?: number;
};

export type FailureInjectResult = {
  id: string;
  name: string;
  injected: string;
  expectedBehavior: string;
  observed: string;
  passed: boolean;
  detail: string;
  latencyMs?: number;
};

export type DbCapacitySnapshot = {
  at: string;
  deepReadyStatus?: string;
  checks?: Array<{ name: string; status: string; latencyMs?: number; detail: string }>;
  metricsDbP95?: number;
  slowQueryCount?: number;
  poolNote?: string;
  source: "live" | "in_process" | "unavailable";
};

export type LoadSuiteReport = {
  sprint: "RC-2";
  generatedAt: string;
  baseUrl: string;
  mode: "live" | "local_target" | "mixed";
  authConfigured: boolean;
  scenarios: ScenarioResult[];
  concurrencyRamp: ScenarioResult[];
  endurance: {
    durationMs: number;
    samples: ResourceSample[];
    summary: ScenarioResult | null;
    observations: string[];
  };
  failureInjection: FailureInjectResult[];
  database: DbCapacitySnapshot;
  baselines: Record<string, Percentiles | { note: string }>;
  issues: Array<{ severity: "info" | "warning" | "critical"; message: string; fix?: string }>;
  releaseReadiness: {
    status: "ready" | "ready_with_gaps" | "not_ready";
    summary: string;
    blockers: string[];
  };
};
