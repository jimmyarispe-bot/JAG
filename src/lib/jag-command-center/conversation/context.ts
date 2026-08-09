/**
 * Gather grounding context from Command Center loaders only.
 */

import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import { loadBriefingList } from "../briefing-engine/query";
import { loadDecisionCenter } from "../decision-center/query";
import type { JagDecisionCard } from "../decision-center/types";
import { loadExecutiveOverview } from "../load-executive-overview";
import { loadForecastsView } from "../predictive/load-forecasts";
import type { JagForecastCard } from "../predictive/load-forecasts";
import { loadScenarioPlanner } from "../scenarios/load-scenarios";
import { loadJagSearchCatalog } from "../search-catalog";
import type { JagSearchItem } from "../search-filter";
import {
  getStoredSchoolHealth,
  listStoredExecutions,
} from "../intelligence-store";
import type { JagExecutiveOverviewModel } from "../types";

export type ConversationGroundingContext = {
  readonly session: JagPlatformSession;
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly overview: JagExecutiveOverviewModel;
  readonly decisions: readonly JagDecisionCard[];
  readonly overdueDecisions: readonly JagDecisionCard[];
  readonly openDecisions: readonly JagDecisionCard[];
  readonly forecasts: readonly JagForecastCard[];
  readonly briefingTitles: readonly { id: string; title: string; href: string }[];
  readonly searchCatalog: readonly JagSearchItem[];
  readonly recentExecutions: readonly {
    id: string;
    contributorId: string;
    label: string;
    confidence: number;
    resultSummary: string;
    analyzedAt: string;
  }[];
  readonly scenarioTemplates: readonly { kind: string; title: string }[];
  readonly healthBound: boolean;
};

const CLOSED = new Set([
  "Completed",
  "Outcome Reviewed",
  "Dismissed",
  "Deferred",
]);

export function gatherConversationContext(
  session: JagPlatformSession,
  organizationId?: string | null
): ConversationGroundingContext {
  const org = resolveActiveWorkspaceOrganization(session, organizationId);
  const overview = loadExecutiveOverview(session, {
    organizationId: org?.id,
  });
  const decisionModel = loadDecisionCenter(session, {
    organizationId: org?.id ?? undefined,
  });
  const decisions = decisionModel.decisions;
  const openDecisions = decisions.filter((d) => !CLOSED.has(d.status));
  const overdueDecisions = openDecisions.filter((d) => d.isOverdue);

  const forecasts = org
    ? loadForecastsView(session, { organizationId: org.id }).cards
    : [];

  const briefings = loadBriefingList(session, {
    organizationId: org?.id ?? undefined,
  });

  const scenarios = loadScenarioPlanner(session, {
    organizationId: org?.id ?? undefined,
  });

  const executions = org
    ? listStoredExecutions(org.id, 12).map((e) => ({
        id: e.id,
        contributorId: e.contributorId,
        label: e.label,
        confidence: e.confidence,
        resultSummary: e.resultSummary,
        analyzedAt: e.analyzedAt,
      }))
    : [];

  const healthBound = org ? Boolean(getStoredSchoolHealth(org.id)) : false;

  return {
    session,
    organizationId: org?.id ?? null,
    organizationName: org?.name ?? null,
    overview,
    decisions,
    overdueDecisions,
    openDecisions,
    forecasts,
    briefingTitles: briefings.briefings.slice(0, 8).map((b) => ({
      id: b.id,
      title: b.title,
      href: `/jag/briefings/${b.id}`,
    })),
    searchCatalog: loadJagSearchCatalog(
      session,
      org?.id || session.organizationId ? "customer" : session.authority === "platform" ? "platform" : "customer"
    ),
    recentExecutions: executions,
    scenarioTemplates: scenarios.templates.map((t) => ({
      kind: t.kind,
      title: t.title,
    })),
    healthBound,
  };
}
