/**
 * RC-1 — Production observability types (APM / RUM / health / alerts).
 * Process-local stores feed the admin dashboard; optional OTLP export for production.
 */

export type LogSeverity = "debug" | "info" | "warn" | "error";

export type ObservabilityContext = {
  requestId: string;
  traceId: string;
  spanId?: string;
  organizationId?: string;
  userId?: string;
  operation?: string;
  route?: string;
};

export type SpanStatus = "ok" | "error";

export type SpanRecord = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: "internal" | "server" | "client" | "producer" | "consumer";
  startMs: number;
  endMs?: number;
  durationMs?: number;
  status: SpanStatus;
  attributes: Record<string, string | number | boolean | undefined>;
  errorMessage?: string;
};

export type MetricKind = "histogram" | "counter";

export type LatencyBucket = {
  count: number;
  sumMs: number;
  minMs: number;
  maxMs: number;
  samples: number[];
};

export type RumMetricName = "TTFB" | "FCP" | "LCP" | "INP" | "CLS" | "TTI";

export type RumSample = {
  id: string;
  name: RumMetricName;
  value: number;
  route: string;
  organizationId?: string;
  browser?: string;
  deviceClass?: "mobile" | "tablet" | "desktop" | "unknown";
  at: string;
  navigationType?: string;
};

export type DbQuerySample = {
  id: string;
  operation: string;
  table?: string;
  durationMs: number;
  ok: boolean;
  errorMessage?: string;
  at: string;
  sequentialScanHint?: boolean;
};

export type HealthCheckStatus = "healthy" | "degraded" | "unavailable";

export type HealthCheckResult = {
  name: string;
  status: HealthCheckStatus;
  latencyMs?: number;
  detail: string;
};

export type HealthReport = {
  status: HealthCheckStatus;
  probe: "liveness" | "readiness" | "deep";
  checks: HealthCheckResult[];
  timestamp: string;
};

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertEvaluation = {
  id: string;
  name: string;
  severity: AlertSeverity;
  triggered: boolean;
  value: number;
  threshold: number;
  unit: string;
  detail: string;
  at: string;
};

export type PercentileStats = {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  avg: number;
};
