/**
 * Sprint 062 — assembles Morning Brief sections from synthesis lights.
 */

import {
  buildAlertCards,
  buildDecisionCards,
  buildOpportunityCards,
  buildOrganizationHealthMetric,
  buildRiskCards,
  sortByPriority,
} from "@/lib/platform/intelligence/briefing/cards";
import {
  buildExecutiveSummaryText,
  buildRecommendedActionCards,
  buildTodaysFocus,
} from "@/lib/platform/intelligence/briefing/engine/summary-engine";
import { buildOvernightIntelligence, buildExecutiveTimeline } from "@/lib/platform/intelligence/briefing/timeline";
import type { BriefingPersonalizerRegistry } from "@/lib/platform/intelligence/briefing/registry";
import { resolvePreferences } from "@/lib/platform/intelligence/briefing/personalization";
import type {
  BriefingCard,
  BriefingRequest,
  ExecutiveBriefing,
} from "@/lib/platform/intelligence/briefing/types";
import { BRIEFING_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/briefing/types";

export function generateExecutiveBriefing(input: {
  request: BriefingRequest;
  registry: BriefingPersonalizerRegistry;
  createId: (prefix: string) => string;
  now: () => Date;
}): ExecutiveBriefing {
  const { request, registry, createId, now } = input;
  const preferences = resolvePreferences(request);
  const synthesis = request.synthesisResult;

  const topRisks = buildRiskCards(synthesis, createId, preferences.maxRisks);
  const topOpportunities = buildOpportunityCards(
    synthesis,
    createId,
    preferences.maxOpportunities
  );
  const decisionsWaiting = buildDecisionCards(
    synthesis,
    createId,
    preferences.maxDecisions
  );
  const criticalAlerts = buildAlertCards(synthesis, createId, preferences.maxAlerts);
  const organizationHealth = buildOrganizationHealthMetric(synthesis, createId);
  const overnight = buildOvernightIntelligence(synthesis);
  const recommendedActions = buildRecommendedActionCards(
    synthesis,
    createId,
    preferences
  );

  const allCards: BriefingCard[] = sortByPriority([
    ...(organizationHealth ? [organizationHealth] : []),
    ...topRisks,
    ...topOpportunities,
    ...decisionsWaiting,
    ...criticalAlerts,
    ...recommendedActions,
  ]).filter((card) => !preferences.hideKinds?.includes(card.kind));

  const todaysFocus = buildTodaysFocus(allCards, createId, 3);
  const greeting = `Good Morning, ${preferences.greetingName}`;
  const executiveSummary = buildExecutiveSummaryText(
    synthesis,
    preferences.greetingName ?? "Executive"
  );

  const timeline = buildExecutiveTimeline(allCards, overnight, createId, now);
  const contributingDomains = [
    ...new Set([
      ...(synthesis?.contributingDomains ?? []),
      ...allCards.flatMap((c) => c.domains),
    ]),
  ];

  const base: ExecutiveBriefing = {
    id: createId("briefing"),
    version: BRIEFING_INTELLIGENCE_VERSION,
    generatedAt: now().toISOString(),
    scope: request.scope,
    role: preferences.role,
    greeting,
    sections: {
      greeting,
      organizationHealth,
      topRisks,
      topOpportunities,
      decisionsWaiting,
      criticalAlerts,
      executiveSummary,
      todaysFocus,
      recommendedActions,
      overnight,
    },
    decisionQueue: decisionsWaiting,
    opportunityQueue: topOpportunities,
    timeline,
    cards: allCards,
    explainability: {
      why:
        synthesis?.explainability?.why ??
        synthesis?.insights?.[0]?.explainability?.why ??
        "Briefing composed from Executive Synthesis outputs ordered by severity, urgency, impact, confidence, and strategic alignment.",
      contributingDomains,
      confidence:
        synthesis?.brief?.confidenceSummary?.overall ??
        synthesis?.explainability?.confidence ??
        45,
      supportingEvidence:
        synthesis?.explainability?.supportingEvidence ??
        synthesis?.insights?.[0]?.explainability?.supportingEvidence ??
        [],
      contradictoryEvidence:
        synthesis?.explainability?.contradictoryEvidence ??
        synthesis?.insights?.[0]?.explainability?.contradictoryEvidence,
    },
    contributingDomains,
    metadata: {
      periodLabel: request.periodLabel,
      synthesisRequestId: synthesis?.requestId,
      ...(request.metadata ?? {}),
    },
  };

  return registry.apply(base, preferences);
}
