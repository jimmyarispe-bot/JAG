/**
 * Organizational Intelligence & Continuous Monitoring — contracts (Sprint 014).
 *
 * Continuously evaluates organizational state across monitors, thresholds,
 * anomalies, alerts, forecasts, health, and executive briefs.
 * Integrates Shared Context, Persistent Memory, Intelligence domains,
 * Goal Execution, and Multi-Agent Collaboration via DI — no DB/UI/services.
 */

import type { SharedIntelligenceContext } from "@/lib/platform/intelligence/context/builder";
import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";
import type { ExecutiveIntelligenceResult } from "@/lib/platform/intelligence/domains/executive/types";
import type { StrategicIntelligenceResult } from "@/lib/platform/intelligence/domains/strategic/types";
import type { DecisionIntelligenceResult } from "@/lib/platform/intelligence/decision/types";
import type {
  ExecutionGoal,
  ExecutionProgressSnapshot,
} from "@/lib/platform/execution/types";
import type { JagCollaborationResult } from "@/lib/platform/jag/collaboration/types";
import type {
  IntelligenceConfidenceScore,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Semantic version of Organizational Intelligence. */
export const ORGANIZATIONAL_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type OrganizationalMetadata = IntelligenceMetadata;

/** Continuous monitoring domains. */
export const ORGANIZATION_MONITOR_KEYS = [
  "enrollment",
  "attendance",
  "academics",
  "finance",
  "cash_flow",
  "hr",
  "operations",
  "compliance",
  "customer_satisfaction",
  "mission",
  "partnerships",
  "board_goals",
  "strategic_goals",
  "executive_kpis",
  "goal_execution",
] as const;
export type OrganizationMonitorKey = (typeof ORGANIZATION_MONITOR_KEYS)[number];

/** Alert severities. */
export const ORGANIZATION_ALERT_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;
export type OrganizationAlertSeverity =
  (typeof ORGANIZATION_ALERT_SEVERITIES)[number];

/** Anomaly kinds. */
export const ORGANIZATION_ANOMALY_KINDS = [
  "unexpected_change",
  "trend_reversal",
  "high_risk",
  "opportunity",
] as const;
export type OrganizationAnomalyKind = (typeof ORGANIZATION_ANOMALY_KINDS)[number];

/** Forecast domains. */
export const ORGANIZATION_FORECAST_DOMAINS = [
  "financial",
  "academic",
  "operational",
  "staffing",
  "capacity",
  "mission",
] as const;
export type OrganizationForecastDomain =
  (typeof ORGANIZATION_FORECAST_DOMAINS)[number];

/** Health bands. */
export const ORGANIZATION_HEALTH_BANDS = [
  "excellent",
  "healthy",
  "watch",
  "at_risk",
  "critical",
] as const;
export type OrganizationHealthBand = (typeof ORGANIZATION_HEALTH_BANDS)[number];

/** A single metric sample for a monitor. */
export interface OrganizationMetricSample {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly previousValue?: number;
  readonly unit?: string;
  readonly observedAt: string;
  readonly metadata?: OrganizationalMetadata;
}

/** Configurable threshold for a metric. */
export interface OrganizationThreshold {
  readonly monitor: OrganizationMonitorKey;
  readonly metricKey: string;
  readonly min?: number;
  readonly max?: number;
  readonly warnBelow?: number;
  readonly warnAbove?: number;
  readonly criticalBelow?: number;
  readonly criticalAbove?: number;
  readonly metadata?: OrganizationalMetadata;
}

/** Observation request / organizational snapshot input. */
export interface OrganizationObservationRequest {
  readonly requestId: string;
  readonly organizationId: string | null;
  readonly schoolId?: string | null;
  readonly observedAt?: string;
  readonly metrics?: readonly OrganizationMetricSample[];
  readonly thresholds?: readonly OrganizationThreshold[];
  readonly sharedContext?: SharedIntelligenceContext;
  readonly memories?: readonly IntelligencePersistentMemoryRecord[];
  readonly executive?: ExecutiveIntelligenceResult;
  readonly strategic?: StrategicIntelligenceResult;
  readonly decision?: DecisionIntelligenceResult;
  readonly executionGoals?: readonly ExecutionGoal[];
  readonly executionProgress?: readonly ExecutionProgressSnapshot[];
  readonly collaboration?: JagCollaborationResult;
  readonly metadata?: OrganizationalMetadata;
}

/** Monitor evaluation result. */
export interface OrganizationMonitorReading {
  readonly monitor: OrganizationMonitorKey;
  readonly status: OrganizationAlertSeverity;
  readonly score: number;
  readonly metrics: readonly OrganizationMetricSample[];
  readonly notes: readonly string[];
  readonly metadata?: OrganizationalMetadata;
}

/** Detected anomaly. */
export interface OrganizationAnomaly {
  readonly anomalyId: string;
  readonly kind: OrganizationAnomalyKind;
  readonly monitor: OrganizationMonitorKey;
  readonly title: string;
  readonly description: string;
  readonly severity: OrganizationAlertSeverity;
  readonly metricKey?: string;
  readonly delta?: number;
  readonly metadata?: OrganizationalMetadata;
}

/** Monitoring event. */
export interface OrganizationMonitorEvent {
  readonly eventId: string;
  readonly type: string;
  readonly monitor: OrganizationMonitorKey;
  readonly message: string;
  readonly severity: OrganizationAlertSeverity;
  readonly occurredAt: string;
  readonly metadata?: OrganizationalMetadata;
}

/** Trigger that fired during observation. */
export interface OrganizationTriggerHit {
  readonly triggerId: string;
  readonly name: string;
  readonly monitor: OrganizationMonitorKey;
  readonly condition: string;
  readonly severity: OrganizationAlertSeverity;
  readonly firedAt: string;
  readonly metadata?: OrganizationalMetadata;
}

/** Alert. */
export interface OrganizationAlert {
  readonly alertId: string;
  readonly severity: OrganizationAlertSeverity;
  readonly monitor: OrganizationMonitorKey;
  readonly title: string;
  readonly message: string;
  readonly createdAt: string;
  readonly acknowledged: boolean;
  readonly metadata?: OrganizationalMetadata;
}

/** Opportunity signal. */
export interface OrganizationOpportunity {
  readonly opportunityId: string;
  readonly monitor: OrganizationMonitorKey;
  readonly title: string;
  readonly description: string;
  readonly expectedValue: string;
  readonly confidence: IntelligenceConfidenceScore;
  readonly metadata?: OrganizationalMetadata;
}

/** Risk signal. */
export interface OrganizationRisk {
  readonly riskId: string;
  readonly monitor: OrganizationMonitorKey;
  readonly title: string;
  readonly description: string;
  readonly severity: OrganizationAlertSeverity;
  readonly likelihood: number;
  readonly mitigation: string;
  readonly metadata?: OrganizationalMetadata;
}

/** Forecast projection. */
export interface OrganizationForecast {
  readonly forecastId: string;
  readonly domain: OrganizationForecastDomain;
  readonly horizonDays: number;
  readonly projectedValue: number;
  readonly currentValue: number;
  readonly direction: "up" | "down" | "flat";
  readonly confidence: IntelligenceConfidenceScore;
  readonly narrative: string;
  readonly metadata?: OrganizationalMetadata;
}

/** Organization-wide health. */
export interface OrganizationHealthScore {
  readonly score: number;
  readonly band: OrganizationHealthBand;
  readonly monitorScores: Readonly<Partial<Record<OrganizationMonitorKey, number>>>;
  readonly summary: string;
  readonly calculatedAt: string;
  readonly metadata?: OrganizationalMetadata;
}

/** Executive recommendation from monitoring. */
export interface OrganizationRecommendation {
  readonly recommendationId: string;
  readonly priority: OrganizationAlertSeverity;
  readonly title: string;
  readonly actions: readonly string[];
  readonly rationale: string;
  readonly relatedMonitors: readonly OrganizationMonitorKey[];
  readonly confidence: IntelligenceConfidenceScore;
  readonly metadata?: OrganizationalMetadata;
}

/** Daily executive brief. */
export interface OrganizationExecutiveBrief {
  readonly briefId: string;
  readonly requestId: string;
  readonly generatedAt: string;
  readonly headline: string;
  readonly summary: string;
  readonly health: OrganizationHealthScore;
  readonly topAlerts: readonly OrganizationAlert[];
  readonly topRisks: readonly OrganizationRisk[];
  readonly topOpportunities: readonly OrganizationOpportunity[];
  readonly recommendations: readonly OrganizationRecommendation[];
  readonly narrative: string;
  readonly metadata?: OrganizationalMetadata;
}

/** Timeline entry for chronological history. */
export interface OrganizationTimelineEntry {
  readonly entryId: string;
  readonly occurredAt: string;
  readonly kind: string;
  readonly title: string;
  readonly detail: string;
  readonly severity?: OrganizationAlertSeverity;
  readonly metadata?: OrganizationalMetadata;
}

/** Aggregate observation result. */
export interface OrganizationObservationResult {
  readonly requestId: string;
  readonly observedAt: string;
  readonly readings: readonly OrganizationMonitorReading[];
  readonly events: readonly OrganizationMonitorEvent[];
  readonly triggers: readonly OrganizationTriggerHit[];
  readonly anomalies: readonly OrganizationAnomaly[];
  readonly alerts: readonly OrganizationAlert[];
  readonly opportunities: readonly OrganizationOpportunity[];
  readonly risks: readonly OrganizationRisk[];
  readonly forecasts: readonly OrganizationForecast[];
  readonly health: OrganizationHealthScore;
  readonly recommendations: readonly OrganizationRecommendation[];
  readonly brief: OrganizationExecutiveBrief;
  readonly timeline: readonly OrganizationTimelineEntry[];
  readonly domainVersion: string;
  readonly completedAt: string;
  readonly metadata?: OrganizationalMetadata;
}

/**
 * Injected clock / id helpers used across modules.
 */
export interface OrganizationRuntimeClock {
  now: () => Date;
  createId?: (prefix: string) => string;
}
