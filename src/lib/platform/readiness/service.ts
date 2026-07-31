import {
  ARCHITECTURE_RULES,
  ALLOWED_CORE_DEPENDENCIES,
  APPLICATION_ENTRY_MODULE,
  CONSUMER_ONLY_MODULES,
  FORBIDDEN_APP_IMPORT_PREFIXES,
  PLATFORM_CORE_MODULES,
} from "@/lib/platform/readiness/architecture";
import {
  BASELINE_SOFT_CEILINGS_MS,
  baselineMetric,
  buildBaselineReport,
  measureElapsedMs,
} from "@/lib/platform/readiness/baselines";
import {
  PlatformEvents,
  clearPlatformEvents,
  emitPlatformEvent,
  listPlatformEvents,
  resetPlatformEventsForTests,
} from "@/lib/platform/readiness/events";
import {
  PLATFORM_RELEASE,
  getVersionGovernance,
} from "@/lib/platform/readiness/versioning";

export function resetReadinessForTests(): void {
  resetPlatformEventsForTests();
}

/**
 * Platform readiness helpers — governance, events, baselines.
 * Not a domain framework.
 */
export const ReadinessService = {
  rules: ARCHITECTURE_RULES,
  coreModules: PLATFORM_CORE_MODULES,
  allowedDependencies: ALLOWED_CORE_DEPENDENCIES,
  forbiddenAppImports: FORBIDDEN_APP_IMPORT_PREFIXES,
  consumerOnly: CONSUMER_ONLY_MODULES,
  applicationEntry: APPLICATION_ENTRY_MODULE,

  version: PLATFORM_RELEASE,
  governance: getVersionGovernance,

  events: PlatformEvents,
  emitEvent: emitPlatformEvent,
  listEvents: listPlatformEvents,
  clearEvents: clearPlatformEvents,

  measure: measureElapsedMs,
  baselineMetric,
  buildBaselineReport,
  softCeilings: BASELINE_SOFT_CEILINGS_MS,

  resetForTests: resetReadinessForTests,
} as const;

export type ReadinessServiceApi = typeof ReadinessService;
