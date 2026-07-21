/**
 * Performance Phase 1 / Sprint P001 — measurement + proven process singletons.
 */

export type * from "./types";
export { nowMs, measureAsync, measureSync, commitTrace } from "./measure";
export { performanceTraceStore } from "./store";
export { runPerformanceProbe, getRecentPerformanceSnapshot } from "./probe";
export {
  getOrCreateIntelligenceSingleton,
  getOrCreateIntegrationsSingleton,
  getIntelligenceSingletonStats,
  getIntegrationsSingletonStats,
  resetPerformanceSingletonsForTests,
} from "./singletons";
export { buildDetections } from "./detections";
export { buildRouteInventory, buildBundleReport } from "./inventory";
export { ServerTimingCollector } from "./server-timing";
export { runStaticPerformanceAudit } from "./static-audit";
export type { StaticAuditReport } from "./static-audit";
export { runP001PerformanceAudit } from "./p001-audit";
export type { P001AuditReport, RankedBottleneck } from "./p001-audit";
