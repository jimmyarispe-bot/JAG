/**
 * RC-1 — Executive / admin performance dashboard aggregates.
 */

import { evaluateAlerts, getTriggeredAlerts } from "./alerts";
import { getDbPoolSnapshot, listSlowQueries, listDbQuerySamples } from "./db-monitor";
import { metricsRegistry, summarizeLatency } from "./metrics";
import { listRumSamples, rumSummaryByRoute } from "./rum";
import { listRecentSpans } from "./tracing";

export function buildObservabilityDashboard() {
  const snapshot = metricsRegistry.snapshot();
  const http = summarizeLatency(metricsRegistry.getHistogram("http.server.duration"));
  const actions = summarizeLatency(metricsRegistry.getHistogram("action.duration"));
  const db = summarizeLatency(metricsRegistry.getHistogram("db.query"));
  const workspace = summarizeLatency(metricsRegistry.getHistogram("workspace.duration"));
  const intel = summarizeLatency(metricsRegistry.getHistogram("intel.duration"));
  const integrations = summarizeLatency(
    metricsRegistry.getHistogram("integration.duration")
  );

  return {
    generatedAt: new Date().toISOString(),
    latency: {
      http,
      actions,
      database: db,
      workspace,
      executiveIntelligence: intel,
      integrations,
    },
    percentiles: {
      p50: http.p50,
      p95: http.p95,
      p99: http.p99,
    },
    slowestRoutes: metricsRegistry.topSlow("http.route.", 10).map((row) => ({
      route: row.name.replace(/^http\.route\./, ""),
      ...row.stats,
    })),
    slowestActions: metricsRegistry.topSlow("action.", 10).map((row) => ({
      action: row.name.replace(/^action\./, ""),
      ...row.stats,
    })),
    slowestQueries: listSlowQueries(15),
    recentQueries: listDbQuerySamples(15),
    workspaceExecution: workspace,
    errorRates: {
      ...snapshot.errors,
      requestCount: snapshot.counters["http.server.requests"] ?? 0,
      rate:
        (snapshot.counters["http.server.requests"] ?? 0) === 0
          ? 0
          : Math.round(
              ((snapshot.errors.total || 0) /
                Math.max(1, snapshot.counters["http.server.requests"] ?? 1)) *
                1000
            ) / 1000,
    },
    activeUsers: snapshot.activeUsers,
    cache: snapshot.cache,
    rum: {
      recent: listRumSamples(20),
      byRoute: rumSummaryByRoute(12),
      lcp: summarizeLatency(metricsRegistry.getHistogram("rum.LCP")),
      inp: summarizeLatency(metricsRegistry.getHistogram("rum.INP")),
      cls: summarizeLatency(metricsRegistry.getHistogram("rum.CLS")),
      ttfb: summarizeLatency(metricsRegistry.getHistogram("rum.TTFB")),
      fcp: summarizeLatency(metricsRegistry.getHistogram("rum.FCP")),
    },
    database: getDbPoolSnapshot(),
    alerts: evaluateAlerts(),
    triggeredAlerts: getTriggeredAlerts(),
    recentSpans: listRecentSpans(25),
  };
}

export type ObservabilityDashboard = ReturnType<typeof buildObservabilityDashboard>;
