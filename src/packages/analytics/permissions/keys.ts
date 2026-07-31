export const ANALYTICS_PERMISSION_KEYS = Object.freeze({
  access: "analytics.access",
  metricsRead: "analytics.metrics.read",
  metricsUpdate: "analytics.metrics.update",
  kpisRead: "analytics.kpis.read",
  kpisUpdate: "analytics.kpis.update",
  trendsRead: "analytics.trends.read",
  trendsUpdate: "analytics.trends.update",
  benchmarksRead: "analytics.benchmarks.read",
  benchmarksUpdate: "analytics.benchmarks.update",
  forecastsRead: "analytics.forecasts.read",
  forecastsUpdate: "analytics.forecasts.update",
  insightsRead: "analytics.insights.read",
  insightsUpdate: "analytics.insights.update",
} as const);

export const ANALYTICS_PERMISSION_PACK_ID =
  "analytics.permission.core" as const;
