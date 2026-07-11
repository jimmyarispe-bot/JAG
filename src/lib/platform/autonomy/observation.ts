/**
 * Autonomous Executive Operating Loop — observation.
 *
 * Collects organizational signals from Organizational Intelligence.
 */

import type { OrganizationObserver } from "@/lib/platform/intelligence/organization/observer";
import type {
  AutonomyLoopRequest,
  AutonomyObservationResult,
  AutonomyObservationSignal,
  AutonomyEscalationSeverity,
} from "@/lib/platform/autonomy/types";
import type { OrganizationAlertSeverity } from "@/lib/platform/intelligence/organization/types";

export interface AutonomyObservationDependencies {
  observer?: OrganizationObserver;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

function mapSeverity(
  severity: OrganizationAlertSeverity | string
): AutonomyEscalationSeverity {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

/**
 * OBSERVE — collect organizational signals for the autonomous loop.
 */
export class AutonomyObservation {
  private readonly observer: OrganizationObserver | null;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyObservationDependencies = {}) {
    this.observer = dependencies.observer ?? null;
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}:${this.now().toISOString()}`);
  }

  async collect(request: AutonomyLoopRequest): Promise<AutonomyObservationResult> {
    const observedAt = this.now().toISOString();
    let organization = request.organization ?? null;

    if (!organization && this.observer && request.observationRequest) {
      organization = await this.observer.observe(request.observationRequest);
    }

    const signals: AutonomyObservationSignal[] = [];

    if (organization) {
      for (const alert of organization.alerts) {
        signals.push({
          signalId: this.createId("sig-alert"),
          source: "organization.alerts",
          kind: "alert",
          title: alert.title,
          detail: alert.message,
          severity: mapSeverity(alert.severity),
          metadata: { monitor: alert.monitor, alertId: alert.alertId },
        });
      }
      for (const risk of organization.risks) {
        signals.push({
          signalId: this.createId("sig-risk"),
          source: "organization.risks",
          kind: "risk",
          title: risk.title,
          detail: risk.description,
          severity: mapSeverity(risk.severity),
          metadata: { monitor: risk.monitor, riskId: risk.riskId },
        });
      }
      for (const anomaly of organization.anomalies) {
        signals.push({
          signalId: this.createId("sig-anomaly"),
          source: "organization.anomalies",
          kind: "anomaly",
          title: anomaly.title,
          detail: anomaly.description,
          severity: mapSeverity(anomaly.severity),
          metricKey: anomaly.metricKey,
          value: anomaly.delta,
          metadata: { anomalyId: anomaly.anomalyId, kind: anomaly.kind },
        });
      }
      for (const reading of organization.readings) {
        if (reading.status === "critical" || reading.status === "high") {
          signals.push({
            signalId: this.createId("sig-monitor"),
            source: "organization.monitors",
            kind: "monitor",
            title: `${reading.monitor} monitor`,
            detail: reading.notes.join("; ") || `Score ${reading.score}`,
            severity: mapSeverity(reading.status),
            value: reading.score,
            metadata: { monitor: reading.monitor },
          });
        }
      }
    }

    for (const progress of request.executionProgress ?? []) {
      if (progress.healthLabel === "at_risk" || progress.healthLabel === "critical") {
        signals.push({
          signalId: this.createId("sig-exec"),
          source: "execution.progress",
          kind: "execution",
          title: `Execution ${progress.subjectId}`,
          detail: progress.notes.join("; ") || `Health ${progress.healthScore}`,
          severity: progress.healthLabel === "critical" ? "critical" : "high",
          value: progress.completionPercent,
          metadata: { subjectKind: progress.subjectKind },
        });
      }
    }

    const metrics =
      request.metrics ??
      organization?.readings.flatMap((r) => r.metrics) ??
      [];

    const criticalCount = signals.filter(
      (s) => s.severity === "critical" || s.severity === "high"
    ).length;

    return {
      requestId: request.requestId,
      observedAt,
      organization,
      signals,
      metrics,
      summary: organization
        ? `Observed ${signals.length} signals (${criticalCount} priority); health ${organization.health.score} (${organization.health.band})`
        : `Observed ${signals.length} signals without organization package`,
    };
  }
}
