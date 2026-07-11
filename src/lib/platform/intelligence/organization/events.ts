/**
 * Organizational Intelligence — events.
 */

import type {
  OrganizationAnomaly,
  OrganizationMonitorEvent,
  OrganizationMonitorReading,
  OrganizationObservationRequest,
  OrganizationTriggerHit,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationEventsDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Emits monitoring events from readings, anomalies, and triggers.
 */
export class OrganizationEvents {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationEventsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  collect(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[],
    anomalies: readonly OrganizationAnomaly[],
    triggers: readonly OrganizationTriggerHit[]
  ): OrganizationMonitorEvent[] {
    const occurredAt = request.observedAt ?? this.now().toISOString();
    const events: OrganizationMonitorEvent[] = [];

    for (const reading of readings) {
      if (reading.status === "informational" && reading.metrics.length === 0) {
        continue;
      }
      events.push({
        eventId: this.createId("event"),
        type: "monitor.evaluated",
        monitor: reading.monitor,
        message: `${reading.monitor} status ${reading.status} (score ${reading.score})`,
        severity: reading.status,
        occurredAt,
      });
    }

    for (const anomaly of anomalies) {
      events.push({
        eventId: this.createId("event"),
        type: `anomaly.${anomaly.kind}`,
        monitor: anomaly.monitor,
        message: anomaly.title,
        severity: anomaly.severity,
        occurredAt,
      });
    }

    for (const trigger of triggers) {
      events.push({
        eventId: this.createId("event"),
        type: "trigger.fired",
        monitor: trigger.monitor,
        message: `${trigger.name}: ${trigger.condition}`,
        severity: trigger.severity,
        occurredAt: trigger.firedAt,
      });
    }

    return events;
  }
}
