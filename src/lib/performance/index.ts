/**
 * Performance Phase 1 — measurement + proven process singletons.
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
