/**
 * Organizational Intelligence — alerts.
 */

import type {
  OrganizationAlert,
  OrganizationAlertSeverity,
  OrganizationAnomaly,
  OrganizationMonitorReading,
  OrganizationObservationRequest,
  OrganizationTriggerHit,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationAlertsDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Generates Critical / High / Medium / Low / Informational alerts.
 */
export class OrganizationAlerts {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationAlertsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  generate(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[],
    anomalies: readonly OrganizationAnomaly[],
    triggers: readonly OrganizationTriggerHit[]
  ): OrganizationAlert[] {
    const createdAt = request.observedAt ?? this.now().toISOString();
    const alerts: OrganizationAlert[] = [];

    for (const reading of readings) {
      if (reading.status === "informational") continue;
      alerts.push({
        alertId: this.createId("alert"),
        severity: reading.status,
        monitor: reading.monitor,
        title: `${reading.monitor.replace(/_/g, " ")} ${reading.status}`,
        message: reading.notes[0] ?? `Monitor ${reading.monitor} requires attention`,
        createdAt,
        acknowledged: false,
      });
    }

    for (const anomaly of anomalies) {
      alerts.push({
        alertId: this.createId("alert"),
        severity: anomaly.severity,
        monitor: anomaly.monitor,
        title: anomaly.title,
        message: anomaly.description,
        createdAt,
        acknowledged: false,
      });
    }

    for (const trigger of triggers) {
      alerts.push({
        alertId: this.createId("alert"),
        severity: trigger.severity,
        monitor: trigger.monitor,
        title: trigger.name,
        message: trigger.condition,
        createdAt,
        acknowledged: false,
      });
    }

    return dedupeAlerts(alerts);
  }

  acknowledge(alert: OrganizationAlert): OrganizationAlert {
    return { ...alert, acknowledged: true };
  }
}

function dedupeAlerts(alerts: readonly OrganizationAlert[]): OrganizationAlert[] {
  const seen = new Set<string>();
  const out: OrganizationAlert[] = [];
  for (const alert of alerts) {
    const key = `${alert.monitor}:${alert.severity}:${alert.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(alert);
  }
  return out.sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity)
  );
}

function severityRank(severity: OrganizationAlertSeverity): number {
  switch (severity) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    case "informational":
      return 4;
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}
