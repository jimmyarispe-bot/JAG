/**
 * Organizational Intelligence & Continuous Monitoring — public API (Sprint 014).
 */

export {
  ORGANIZATIONAL_INTELLIGENCE_VERSION,
  ORGANIZATION_ALERT_SEVERITIES,
  ORGANIZATION_ANOMALY_KINDS,
  ORGANIZATION_FORECAST_DOMAINS,
  ORGANIZATION_HEALTH_BANDS,
  ORGANIZATION_MONITOR_KEYS,
  type OrganizationAlert,
  type OrganizationAlertSeverity,
  type OrganizationAnomaly,
  type OrganizationAnomalyKind,
  type OrganizationExecutiveBrief,
  type OrganizationForecast,
  type OrganizationForecastDomain,
  type OrganizationHealthBand,
  type OrganizationHealthScore,
  type OrganizationMetricSample,
  type OrganizationMonitorEvent,
  type OrganizationMonitorKey,
  type OrganizationMonitorReading,
  type OrganizationObservationRequest,
  type OrganizationObservationResult,
  type OrganizationOpportunity,
  type OrganizationRecommendation,
  type OrganizationRisk,
  type OrganizationThreshold,
  type OrganizationTimelineEntry,
  type OrganizationTriggerHit,
  type OrganizationalMetadata,
} from "@/lib/platform/intelligence/organization/types";

export {
  DEFAULT_ORGANIZATION_THRESHOLDS,
  OrganizationThresholds,
  type OrganizationThresholdsDependencies,
} from "@/lib/platform/intelligence/organization/thresholds";

export {
  OrganizationMonitors,
  type OrganizationMonitorsDependencies,
} from "@/lib/platform/intelligence/organization/monitors";

export {
  OrganizationAnomalies,
  type OrganizationAnomaliesDependencies,
} from "@/lib/platform/intelligence/organization/anomalies";

export {
  OrganizationEvents,
  type OrganizationEventsDependencies,
} from "@/lib/platform/intelligence/organization/events";

export {
  OrganizationTriggers,
  type OrganizationTriggerDefinition,
  type OrganizationTriggersDependencies,
} from "@/lib/platform/intelligence/organization/triggers";

export {
  OrganizationAlerts,
  type OrganizationAlertsDependencies,
} from "@/lib/platform/intelligence/organization/alerts";

export {
  OrganizationOpportunities,
  type OrganizationOpportunitiesDependencies,
} from "@/lib/platform/intelligence/organization/opportunities";

export {
  OrganizationRisks,
  type OrganizationRisksDependencies,
} from "@/lib/platform/intelligence/organization/risks";

export {
  OrganizationForecasts,
  type OrganizationForecastsDependencies,
} from "@/lib/platform/intelligence/organization/forecasts";

export {
  OrganizationHealth,
  type OrganizationHealthDependencies,
} from "@/lib/platform/intelligence/organization/health";

export {
  OrganizationRecommendations,
  type OrganizationRecommendationsDependencies,
} from "@/lib/platform/intelligence/organization/recommendations";

export {
  OrganizationExecutiveBriefBuilder,
  type OrganizationExecutiveBriefDependencies,
} from "@/lib/platform/intelligence/organization/executive-brief";

export {
  OrganizationTimeline,
  type OrganizationTimelineDependencies,
} from "@/lib/platform/intelligence/organization/timeline";

export {
  OrganizationObserver,
  type OrganizationObserverDependencies,
} from "@/lib/platform/intelligence/organization/observer";

export {
  InMemoryOrganizationScheduleRunner,
  OrganizationScheduler,
  type OrganizationScheduleRunner,
  type OrganizationSchedulerDependencies,
} from "@/lib/platform/intelligence/organization/scheduler";

import { OrganizationObserver } from "@/lib/platform/intelligence/organization/observer";
import { OrganizationScheduler } from "@/lib/platform/intelligence/organization/scheduler";
import type { OrganizationObserverDependencies } from "@/lib/platform/intelligence/organization/observer";
import type { OrganizationScheduleRunner } from "@/lib/platform/intelligence/organization/scheduler";
import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";

/** Factory options for Organizational Intelligence. */
export interface CreateOrganizationalIntelligenceOptions
  extends OrganizationObserverDependencies {
  runner?: OrganizationScheduleRunner;
  memory?: PersistentIntelligenceMemory;
}

/**
 * Create observer + scheduler wired for continuous organizational monitoring.
 */
export function createOrganizationalIntelligence(
  options: CreateOrganizationalIntelligenceOptions = {}
): {
  observer: OrganizationObserver;
  scheduler: OrganizationScheduler;
} {
  const observer = new OrganizationObserver(options);
  const scheduler = new OrganizationScheduler({
    observer,
    runner: options.runner,
  });
  return { observer, scheduler };
}
