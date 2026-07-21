/**
 * RC-1 — threshold-based alert evaluation (in-process).
 * Wire external notifiers (PagerDuty/Slack) via OTEL/logs in production ops.
 */

import { getDbPoolSnapshot, listSlowQueries } from "./db-monitor";
import { metricsRegistry, summarizeLatency } from "./metrics";
import type { AlertEvaluation } from "./types";

const THRESHOLDS = {
  apiP95Ms: Number(process.env.OBSERVABILITY_ALERT_API_P95_MS ?? 2000),
  dbSlowCount: Number(process.env.OBSERVABILITY_ALERT_DB_SLOW_COUNT ?? 10),
  errorRate: Number(process.env.OBSERVABILITY_ALERT_ERROR_RATE ?? 0.05),
  rumLcpMs: Number(process.env.OBSERVABILITY_ALERT_RUM_LCP_MS ?? 4000),
} as const;

function evalAlert(
  id: string,
  name: string,
  value: number,
  threshold: number,
  unit: string,
  severity: AlertEvaluation["severity"],
  detail: string,
  higherIsBad = true
): AlertEvaluation {
  const triggered = higherIsBad ? value > threshold : value < threshold;
  return {
    id,
    name,
    severity,
    triggered,
    value: Math.round(value * 1000) / 1000,
    threshold,
    unit,
    detail,
    at: new Date().toISOString(),
  };
}

export function evaluateAlerts(): AlertEvaluation[] {
  const apiStats = summarizeLatency(metricsRegistry.getHistogram("http.server.duration"));
  const errors = metricsRegistry.getCounter("errors.total");
  const requests = Math.max(1, metricsRegistry.getCounter("http.server.requests"));
  const errorRate = errors / requests;
  const rumLcp = summarizeLatency(metricsRegistry.getHistogram("rum.LCP"));
  const pool = getDbPoolSnapshot();
  const slow = listSlowQueries(50).length;

  return [
    evalAlert(
      "api.p95",
      "API p95 latency",
      apiStats.p95,
      THRESHOLDS.apiP95Ms,
      "ms",
      "critical",
      `HTTP server p95 ${apiStats.p95}ms (n=${apiStats.count})`
    ),
    evalAlert(
      "errors.rate",
      "Error rate",
      errorRate,
      THRESHOLDS.errorRate,
      "ratio",
      "critical",
      `${errors} errors / ${requests} requests`
    ),
    evalAlert(
      "db.slow",
      "Slow query burst",
      slow,
      THRESHOLDS.dbSlowCount,
      "count",
      "warning",
      `${slow} slow queries retained (threshold ${pool.slowQueryThresholdMs}ms)`
    ),
    evalAlert(
      "rum.lcp",
      "RUM LCP p95",
      rumLcp.p95,
      THRESHOLDS.rumLcpMs,
      "ms",
      "warning",
      `LCP p95 ${rumLcp.p95}ms (n=${rumLcp.count})`
    ),
  ];
}

export function getTriggeredAlerts(): AlertEvaluation[] {
  return evaluateAlerts().filter((a) => a.triggered);
}
