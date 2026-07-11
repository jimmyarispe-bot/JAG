/**
 * Organizational Intelligence — opportunities.
 */

import type {
  OrganizationAnomaly,
  OrganizationMonitorReading,
  OrganizationObservationRequest,
  OrganizationOpportunity,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationOpportunitiesDependencies {
  createId?: (prefix: string) => string;
}

/**
 * Surfaces organizational opportunities from anomalies and positive trends.
 */
export class OrganizationOpportunities {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationOpportunitiesDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  detect(
    request: OrganizationObservationRequest,
    readings: readonly OrganizationMonitorReading[],
    anomalies: readonly OrganizationAnomaly[]
  ): OrganizationOpportunity[] {
    const opportunities: OrganizationOpportunity[] = [];

    for (const anomaly of anomalies.filter((a) => a.kind === "opportunity")) {
      opportunities.push({
        opportunityId: this.createId("opportunity"),
        monitor: anomaly.monitor,
        title: anomaly.title,
        description: anomaly.description,
        expectedValue: "Capture positive momentum before it decays",
        confidence: { value: 0.65, level: "medium", factors: [] },
      });
    }

    for (const reading of readings) {
      if (reading.score >= 85 && reading.metrics.length > 0) {
        opportunities.push({
          opportunityId: this.createId("opportunity"),
          monitor: reading.monitor,
          title: `Scale strength in ${reading.monitor.replace(/_/g, " ")}`,
          description: `${reading.monitor} is healthy (score ${reading.score}); consider scaling related initiatives.`,
          expectedValue: "Compound gains from strong operational posture",
          confidence: { value: 0.7, level: "medium", factors: [] },
        });
      }
    }

    for (const opportunity of request.strategic?.analysis.opportunities ?? []) {
      if (
        opportunity.kind.includes("opportunity") ||
        opportunity.kind.includes("growth")
      ) {
        opportunities.push({
          opportunityId: this.createId("opportunity"),
          monitor: "strategic_goals",
          title: opportunity.title,
          description: opportunity.description,
          expectedValue: opportunity.kind,
          confidence: opportunity.confidence,
        });
      }
    }

    if (request.collaboration?.consensus) {
      opportunities.push({
        opportunityId: this.createId("opportunity"),
        monitor: "executive_kpis",
        title: `Advance collaboration consensus: ${request.collaboration.consensus.title}`,
        description: request.collaboration.consensus.summary,
        expectedValue: "Convert multi-agent consensus into execution",
        confidence: request.collaboration.confidence.score,
      });
    }

    return opportunities.slice(0, 12);
  }
}
