/**
 * Organizational Intelligence — executive brief.
 */

import type {
  OrganizationAlert,
  OrganizationExecutiveBrief,
  OrganizationHealthScore,
  OrganizationObservationRequest,
  OrganizationOpportunity,
  OrganizationRecommendation,
  OrganizationRisk,
} from "@/lib/platform/intelligence/organization/types";

export interface OrganizationExecutiveBriefDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Produces daily executive summaries from monitoring results.
 */
export class OrganizationExecutiveBriefBuilder {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: OrganizationExecutiveBriefDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  build(input: {
    request: OrganizationObservationRequest;
    health: OrganizationHealthScore;
    alerts: readonly OrganizationAlert[];
    risks: readonly OrganizationRisk[];
    opportunities: readonly OrganizationOpportunity[];
    recommendations: readonly OrganizationRecommendation[];
  }): OrganizationExecutiveBrief {
    const generatedAt = input.request.observedAt ?? this.now().toISOString();
    const topAlerts = input.alerts.slice(0, 5);
    const topRisks = input.risks.slice(0, 5);
    const topOpportunities = input.opportunities.slice(0, 5);

    const headline = `Org health ${input.health.score} (${input.health.band}) — ${topAlerts.length} alert(s), ${topRisks.length} risk(s)`;
    const summary = `${input.health.summary} Priority recommendation: ${input.recommendations[0]?.title ?? "none"}.`;

    const narrative = [
      `Headline: ${headline}`,
      `Summary: ${summary}`,
      `Top Alerts: ${topAlerts.map((a) => a.title).join("; ") || "None"}`,
      `Top Risks: ${topRisks.map((r) => r.title).join("; ") || "None"}`,
      `Opportunities: ${topOpportunities.map((o) => o.title).join("; ") || "None"}`,
      `Recommendations: ${input.recommendations.map((r) => r.title).join("; ") || "None"}`,
    ].join("\n\n");

    return {
      briefId: this.createId("brief"),
      requestId: input.request.requestId,
      generatedAt,
      headline,
      summary,
      health: input.health,
      topAlerts,
      topRisks,
      topOpportunities,
      recommendations: input.recommendations,
      narrative,
      metadata: input.request.metadata,
    };
  }
}
