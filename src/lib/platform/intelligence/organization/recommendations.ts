/**
 * Organizational Intelligence — recommendations.
 */

import type {
  OrganizationAlert,
  OrganizationHealthScore,
  OrganizationObservationRequest,
  OrganizationOpportunity,
  OrganizationRecommendation,
  OrganizationRisk,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationRecommendationsDependencies {
  createId?: (prefix: string) => string;
}

/**
 * Automatically generates executive recommendations from monitoring output.
 */
export class OrganizationRecommendations {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationRecommendationsDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  generate(
    request: OrganizationObservationRequest,
    health: OrganizationHealthScore,
    alerts: readonly OrganizationAlert[],
    risks: readonly OrganizationRisk[],
    opportunities: readonly OrganizationOpportunity[]
  ): OrganizationRecommendation[] {
    const recommendations: OrganizationRecommendation[] = [];

    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      recommendations.push({
        recommendationId: this.createId("rec"),
        priority: "critical",
        title: "Stabilize critical monitors immediately",
        actions: criticalAlerts.slice(0, 3).map((a) => `Remediate: ${a.title}`),
        rationale: `${criticalAlerts.length} critical alert(s); org health ${health.score}.`,
        relatedMonitors: criticalAlerts.map((a) => a.monitor),
        confidence: { value: 0.82, level: "high", factors: [] },
      });
    }

    if (risks[0]) {
      recommendations.push({
        recommendationId: this.createId("rec"),
        priority: risks[0].severity,
        title: `Mitigate ${risks[0].title}`,
        actions: [risks[0].mitigation, "Schedule executive review within 7 days"],
        rationale: risks[0].description,
        relatedMonitors: [risks[0].monitor],
        confidence: { value: 0.74, level: "medium", factors: [] },
      });
    }

    if (opportunities[0] && health.band !== "critical") {
      recommendations.push({
        recommendationId: this.createId("rec"),
        priority: "medium",
        title: `Pursue opportunity: ${opportunities[0].title}`,
        actions: [
          opportunities[0].description,
          "Convert opportunity into a Goal Execution package",
        ],
        rationale: opportunities[0].expectedValue,
        relatedMonitors: [opportunities[0].monitor],
        confidence: opportunities[0].confidence,
      });
    }

    if (request.collaboration?.plan.steps.length) {
      recommendations.push({
        recommendationId: this.createId("rec"),
        priority: "high",
        title: "Execute multi-agent collaboration plan",
        actions: request.collaboration.plan.steps
          .slice(0, 3)
          .map((s) => s.instruction),
        rationale: request.collaboration.plan.summary,
        relatedMonitors: ["executive_kpis", "strategic_goals", "goal_execution"],
        confidence: request.collaboration.confidence.score,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: this.createId("rec"),
        priority: "informational",
        title: "Maintain monitoring cadence",
        actions: [
          "Continue daily observation",
          "Review thresholds for under-instrumented monitors",
        ],
        rationale: health.summary,
        relatedMonitors: ["executive_kpis"],
        confidence: { value: 0.55, level: "medium", factors: [] },
      });
    }

    return recommendations;
  }
}
