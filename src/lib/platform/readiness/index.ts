export {
  ReadinessService,
  resetReadinessForTests,
} from "@/lib/platform/readiness/service";
export type { ReadinessServiceApi } from "@/lib/platform/readiness/service";

export {
  ARCHITECTURE_RULES,
  ALLOWED_CORE_DEPENDENCIES,
  APPLICATION_ENTRY_MODULE,
  CONSUMER_ONLY_MODULES,
  FORBIDDEN_APP_IMPORT_PREFIXES,
  PLATFORM_CORE_MODULES,
} from "@/lib/platform/readiness/architecture";

export {
  PlatformEvents,
  emitPlatformEvent,
  listPlatformEvents,
  clearPlatformEvents,
  resetPlatformEventsForTests,
} from "@/lib/platform/readiness/events";

export {
  PLATFORM_RELEASE,
  getVersionGovernance,
} from "@/lib/platform/readiness/versioning";

export {
  measureElapsedMs,
  baselineMetric,
  buildBaselineReport,
  BASELINE_SOFT_CEILINGS_MS,
} from "@/lib/platform/readiness/baselines";

export type {
  PlatformBaselineMetric,
  PlatformBaselineReport,
  PlatformOperatingEvent,
  PlatformOperatingEventType,
} from "@/lib/platform/readiness/types";
