/**
 * Organizational Intelligence — observer.
 *
 * Continuously evaluates organizational state by coordinating monitors,
 * anomalies, alerts, forecasts, health, recommendations, and briefs.
 */

import { OrganizationAlerts } from "@/lib/platform/intelligence/organization/alerts";
import { OrganizationAnomalies } from "@/lib/platform/intelligence/organization/anomalies";
import { OrganizationEvents } from "@/lib/platform/intelligence/organization/events";
import { OrganizationExecutiveBriefBuilder } from "@/lib/platform/intelligence/organization/executive-brief";
import { OrganizationForecasts } from "@/lib/platform/intelligence/organization/forecasts";
import { OrganizationHealth } from "@/lib/platform/intelligence/organization/health";
import { OrganizationMonitors } from "@/lib/platform/intelligence/organization/monitors";
import { OrganizationOpportunities } from "@/lib/platform/intelligence/organization/opportunities";
import { OrganizationRecommendations } from "@/lib/platform/intelligence/organization/recommendations";
import { OrganizationRisks } from "@/lib/platform/intelligence/organization/risks";
import { OrganizationThresholds } from "@/lib/platform/intelligence/organization/thresholds";
import { OrganizationTimeline } from "@/lib/platform/intelligence/organization/timeline";
import { OrganizationTriggers } from "@/lib/platform/intelligence/organization/triggers";
import type {
  OrganizationObservationRequest,
  OrganizationObservationResult,
} from "@/lib/platform/intelligence/organization/types";
import { ORGANIZATIONAL_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/organization/types";
import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";

/** Injected collaborators for the organization observer. */
export interface OrganizationObserverDependencies {
  thresholds?: OrganizationThresholds;
  monitors?: OrganizationMonitors;
  anomalies?: OrganizationAnomalies;
  events?: OrganizationEvents;
  triggers?: OrganizationTriggers;
  alerts?: OrganizationAlerts;
  opportunities?: OrganizationOpportunities;
  risks?: OrganizationRisks;
  forecasts?: OrganizationForecasts;
  health?: OrganizationHealth;
  recommendations?: OrganizationRecommendations;
  brief?: OrganizationExecutiveBriefBuilder;
  timeline?: OrganizationTimeline;
  memory?: PersistentIntelligenceMemory;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Organization Observer — single entry for continuous evaluation cycles.
 */
export class OrganizationObserver {
  private readonly monitors: OrganizationMonitors;
  private readonly anomalies: OrganizationAnomalies;
  private readonly events: OrganizationEvents;
  private readonly triggers: OrganizationTriggers;
  private readonly alerts: OrganizationAlerts;
  private readonly opportunities: OrganizationOpportunities;
  private readonly risks: OrganizationRisks;
  private readonly forecasts: OrganizationForecasts;
  private readonly health: OrganizationHealth;
  private readonly recommendations: OrganizationRecommendations;
  private readonly brief: OrganizationExecutiveBriefBuilder;
  private readonly timeline: OrganizationTimeline;
  private readonly memory: PersistentIntelligenceMemory | null;
  private readonly now: () => Date;

  constructor(dependencies: OrganizationObserverDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId = dependencies.createId;
    this.now = now;

    const thresholds = dependencies.thresholds ?? new OrganizationThresholds();
    this.monitors =
      dependencies.monitors ?? new OrganizationMonitors({ thresholds });
    this.anomalies =
      dependencies.anomalies ?? new OrganizationAnomalies({ createId });
    this.events = dependencies.events ?? new OrganizationEvents({ now, createId });
    this.triggers = dependencies.triggers ?? new OrganizationTriggers({ now });
    this.alerts = dependencies.alerts ?? new OrganizationAlerts({ now, createId });
    this.opportunities =
      dependencies.opportunities ?? new OrganizationOpportunities({ createId });
    this.risks = dependencies.risks ?? new OrganizationRisks({ createId });
    this.forecasts =
      dependencies.forecasts ?? new OrganizationForecasts({ createId });
    this.health = dependencies.health ?? new OrganizationHealth({ now });
    this.recommendations =
      dependencies.recommendations ??
      new OrganizationRecommendations({ createId });
    this.brief =
      dependencies.brief ??
      new OrganizationExecutiveBriefBuilder({ now, createId });
    this.timeline =
      dependencies.timeline ?? new OrganizationTimeline({ createId });
    this.memory = dependencies.memory ?? null;
  }

  /**
   * Run one organizational observation cycle.
   */
  async observe(
    request: OrganizationObservationRequest
  ): Promise<OrganizationObservationResult> {
    const observedAt = request.observedAt ?? this.now().toISOString();
    const scoped: OrganizationObservationRequest = { ...request, observedAt };

    const readings = this.monitors.evaluate(scoped);
    const anomalies = this.anomalies.detect(scoped, readings);
    const triggers = this.triggers.evaluate(scoped, readings);
    const events = this.events.collect(scoped, readings, anomalies, triggers);
    const alerts = this.alerts.generate(scoped, readings, anomalies, triggers);
    const opportunities = this.opportunities.detect(scoped, readings, anomalies);
    const risks = this.risks.detect(scoped, readings, anomalies);
    const forecasts = this.forecasts.project(scoped, readings);
    const health = this.health.calculate(scoped, readings);
    const recommendations = this.recommendations.generate(
      scoped,
      health,
      alerts,
      risks,
      opportunities
    );
    const brief = this.brief.build({
      request: scoped,
      health,
      alerts,
      risks,
      opportunities,
      recommendations,
    });
    const timeline = this.timeline.build(
      scoped,
      events,
      anomalies,
      triggers,
      alerts
    );

    if (this.memory) {
      const record = this.memory.createMemory({
        domain: "operational",
        executionId: scoped.requestId,
        organizationId: scoped.organizationId,
        schoolId: scoped.schoolId ?? null,
        observations: [
          health.summary,
          ...alerts.slice(0, 3).map((a) => a.title),
        ],
        recommendations: recommendations.map((r) => r.title),
        confidence: {
          value: health.score / 100,
          level:
            health.score >= 75 ? "high" : health.score >= 50 ? "medium" : "low",
          factors: [],
        },
        contextSnapshot: {
          healthScore: health.score,
          alertCount: alerts.length,
        },
        request: { subject: "organizational-observation" },
        metadata: { source: "organizational_intelligence" },
      });
      await this.memory.saveMemory(record);
    }

    return {
      requestId: scoped.requestId,
      observedAt,
      readings,
      events,
      triggers,
      anomalies,
      alerts,
      opportunities,
      risks,
      forecasts,
      health,
      recommendations,
      brief,
      timeline,
      domainVersion: ORGANIZATIONAL_INTELLIGENCE_VERSION,
      completedAt: this.now().toISOString(),
      metadata: scoped.metadata,
    };
  }
}
