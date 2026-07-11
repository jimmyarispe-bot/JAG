/**
 * Organizational Intelligence — timeline.
 */

import type {
  OrganizationAlert,
  OrganizationAnomaly,
  OrganizationMonitorEvent,
  OrganizationObservationRequest,
  OrganizationTimelineEntry,
  OrganizationTriggerHit,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationTimelineDependencies {
  createId?: (prefix: string) => string;
}

/**
 * Builds chronological intelligence history for an observation cycle.
 */
export class OrganizationTimeline {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationTimelineDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  build(
    request: OrganizationObservationRequest,
    events: readonly OrganizationMonitorEvent[],
    anomalies: readonly OrganizationAnomaly[],
    triggers: readonly OrganizationTriggerHit[],
    alerts: readonly OrganizationAlert[]
  ): OrganizationTimelineEntry[] {
    const entries: OrganizationTimelineEntry[] = [];

    entries.push({
      entryId: this.createId("timeline"),
      occurredAt: request.observedAt ?? new Date().toISOString(),
      kind: "observation.started",
      title: "Organizational observation",
      detail: `Observation ${request.requestId} for org ${request.organizationId ?? "n/a"}`,
      severity: "informational",
    });

    for (const event of events) {
      entries.push({
        entryId: this.createId("timeline"),
        occurredAt: event.occurredAt,
        kind: event.type,
        title: event.message,
        detail: `Monitor ${event.monitor}`,
        severity: event.severity,
      });
    }

    for (const anomaly of anomalies) {
      entries.push({
        entryId: this.createId("timeline"),
        occurredAt: request.observedAt ?? new Date().toISOString(),
        kind: `anomaly.${anomaly.kind}`,
        title: anomaly.title,
        detail: anomaly.description,
        severity: anomaly.severity,
      });
    }

    for (const trigger of triggers) {
      entries.push({
        entryId: this.createId("timeline"),
        occurredAt: trigger.firedAt,
        kind: "trigger",
        title: trigger.name,
        detail: trigger.condition,
        severity: trigger.severity,
      });
    }

    for (const alert of alerts.slice(0, 10)) {
      entries.push({
        entryId: this.createId("timeline"),
        occurredAt: alert.createdAt,
        kind: "alert",
        title: alert.title,
        detail: alert.message,
        severity: alert.severity,
      });
    }

    return entries.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }
}
