/**
 * Organizational Intelligence — anomalies.
 */

import type {
  OrganizationAnomaly,
  OrganizationAnomalyKind,
  OrganizationMonitorReading,
  OrganizationObservationRequest,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationAnomaliesDependencies {
  createId?: (prefix: string) => string;
}

/**
 * Detects unexpected changes, trend reversals, high-risk situations, opportunities.
 */
export class OrganizationAnomalies {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationAnomaliesDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  detect(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[]
  ): OrganizationAnomaly[] {
    const anomalies: OrganizationAnomaly[] = [];

    for (const reading of readings) {
      for (const metric of reading.metrics) {
        if (
          metric.previousValue !== undefined &&
          Number.isFinite(metric.previousValue)
        ) {
          const delta = metric.value - metric.previousValue;
          const magnitude =
            metric.previousValue === 0
              ? Math.abs(delta)
              : Math.abs(delta / metric.previousValue);

          if (magnitude >= 0.15) {
            anomalies.push(
              this.make(
                magnitude >= 0.3 ? "unexpected_change" : "trend_reversal",
                reading.monitor,
                `${metric.label} shifted`,
                `${metric.label} moved from ${metric.previousValue} to ${metric.value}`,
                magnitude >= 0.3 ? "high" : "medium",
                metric.key,
                delta
              )
            );
          }

          if (delta > 0 && reading.monitor === "enrollment" && magnitude >= 0.1) {
            anomalies.push(
              this.make(
                "opportunity",
                reading.monitor,
                "Enrollment upside",
                `Enrollment metric ${metric.label} improved by ${delta}`,
                "informational",
                metric.key,
                delta
              )
            );
          }
        }
      }

      if (reading.status === "critical" || reading.score < 40) {
        anomalies.push(
          this.make(
            "high_risk",
            reading.monitor,
            `High-risk ${reading.monitor.replace(/_/g, " ")}`,
            reading.notes[0] ?? `Monitor ${reading.monitor} in critical posture`,
            "critical"
          )
        );
      }
    }

    if (request.decision?.risks.primaryRisk) {
      anomalies.push(
        this.make(
          "high_risk",
          "executive_kpis",
          request.decision.risks.primaryRisk.title,
          request.decision.risks.primaryRisk.description,
          "high"
        )
      );
    }

    return anomalies;
  }

  private make(
    kind: OrganizationAnomalyKind,
    monitor: OrganizationAnomaly["monitor"],
    title: string,
    description: string,
    severity: OrganizationAnomaly["severity"],
    metricKey?: string,
    delta?: number
  ): OrganizationAnomaly {
    return {
      anomalyId: this.createId("anomaly"),
      kind,
      monitor,
      title,
      description,
      severity,
      metricKey,
      delta,
    };
  }
}
