/**
 * Organizational Intelligence — risks.
 */

import type {
  OrganizationAnomaly,
  OrganizationMonitorReading,
  OrganizationObservationRequest,
  OrganizationRisk,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationRisksDependencies {
  createId?: (prefix: string) => string;
}

/**
 * Identifies organizational risks from monitors and integrations.
 */
export class OrganizationRisks {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationRisksDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  detect(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[],
    anomalies: readonly OrganizationAnomaly[]
  ): OrganizationRisk[] {
    const risks: OrganizationRisk[] = [];

    for (const reading of readings) {
      if (reading.status === "critical" || reading.status === "high") {
        risks.push({
          riskId: this.createId("risk"),
          monitor: reading.monitor,
          title: `${reading.monitor.replace(/_/g, " ")} risk`,
          description: reading.notes[0] ?? `Elevated ${reading.monitor} posture`,
          severity: reading.status,
          likelihood: reading.status === "critical" ? 0.8 : 0.6,
          mitigation: `Assign owner and remediation plan for ${reading.monitor}`,
        });
      }
    }

    for (const anomaly of anomalies.filter((a) => a.kind === "high_risk")) {
      risks.push({
        riskId: this.createId("risk"),
        monitor: anomaly.monitor,
        title: anomaly.title,
        description: anomaly.description,
        severity: anomaly.severity,
        likelihood: 0.75,
        mitigation: "Escalate to executive sponsors and verify evidence",
      });
    }

    for (const risk of request.decision?.risks.risks.slice(0, 3) ?? []) {
      risks.push({
        riskId: this.createId("risk"),
        monitor: "executive_kpis",
        title: risk.title,
        description: risk.description,
        severity: risk.severity === "critical" ? "critical" : "high",
        likelihood: risk.likelihood,
        mitigation: risk.mitigation,
      });
    }

    return risks.slice(0, 15);
  }
}
