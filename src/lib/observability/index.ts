/**
 * RC-1 — Production observability public surface.
 */

export type * from "./types";
export {
  getObservabilityContext,
  runWithObservabilityContext,
  runWithObservabilityContextAsync,
  updateObservabilityContext,
  contextFromHeaders,
  newId,
  newTraceId,
  newSpanId,
  toTraceparent,
} from "./context";
export { resolveRequestTraceIds, applyTraceHeaders } from "./request-ids";
export type { RequestTraceIds } from "./request-ids";
export { logger, logStructured } from "./logger";
export { metricsRegistry, summarizeLatency } from "./metrics";
export { startSpan, withSpan, listRecentSpans, initTracing } from "./tracing";
export {
  recordRumSample,
  listRumSamples,
  rumSummaryByRoute,
  isRumMetricName,
} from "./rum";
export {
  observeDbOperation,
  listDbQuerySamples,
  listSlowQueries,
  getDbPoolSnapshot,
} from "./db-monitor";
export { evaluateAlerts, getTriggeredAlerts } from "./alerts";
export {
  buildLivenessReport,
  buildReadinessEnvChecks,
  runDeepHealthChecks,
  httpStatusForHealth,
} from "./health";
export {
  observeServerAction,
  observeWorkspaceExecution,
  observeExecutiveIntelligence,
  observeIntegration,
  recordHttpRequest,
  recordCacheHit,
  recordCacheMiss,
  ensureObservabilityContext,
  beginMiddlewareObservation,
} from "./instrument";
export { buildObservabilityDashboard } from "./dashboard";
export type { ObservabilityDashboard } from "./dashboard";
export { initObservability } from "./init";
