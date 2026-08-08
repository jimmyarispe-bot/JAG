/**
 * Load advisory forecasts for Executive Overview / Decision Center / Briefings.
 * Does not import decision-center/query (avoids circular dependency).
 */

import {
  PredictionService,
  type DecisionConsequenceForecast,
  type PredictionHorizon,
  type PredictionKind,
  type PredictionResult,
} from "@/lib/platform/intelligence/predictive";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import { projectDecisionsFromExecutions } from "../decision-center/project";
import type { JagDecisionCard } from "../decision-center/types";
import { recordJagAuditEvent } from "../audit/store";
import {
  listStoredExecutions,
  listStoredExecutionsForOrganizations,
} from "../intelligence-store";
import { buildPredictionContext } from "./build-context";

export type JagForecastCard = {
  readonly id: string;
  readonly kind: PredictionKind;
  readonly title: string;
  readonly horizonLabel: string;
  readonly trend: string;
  readonly confidence: number;
  readonly confidenceBand: string;
  readonly riskLevel: string;
  readonly drivers: readonly string[];
  readonly actions: readonly string[];
  readonly predictedSummary: string;
  readonly advisoryNotice: string;
  readonly insufficientData: boolean;
};

export type JagForecastsView = {
  readonly status: "ready" | "empty";
  readonly advisoryNotice: string;
  readonly cards: readonly JagForecastCard[];
  readonly observationId: string | null;
  readonly explanation: string;
};

const OVERVIEW_KINDS: readonly PredictionKind[] = [
  "organization_health",
  "operational_readiness",
  "student_success",
  "funding_readiness",
  "decision_queue_growth",
  "staffing_capacity",
  "enrollment_trend",
  "compliance_risk",
];

const OPEN_STATUSES = new Set([
  "New",
  "Reviewing",
  "Approved",
  "Assigned",
  "In Progress",
]);

function decisionsForOrg(
  organizationId: string,
  organizationName: string
): JagDecisionCard[] {
  const executions = listStoredExecutions(organizationId, 200);
  return projectDecisionsFromExecutions({
    executions,
    organizationNames: { [organizationId]: organizationName },
  });
}

export function loadForecastsView(
  session: JagPlatformSession,
  options?: {
    readonly organizationId?: string;
    readonly horizon?: PredictionHorizon;
    readonly kinds?: readonly PredictionKind[];
  }
): JagForecastsView {
  const organization = resolveActiveWorkspaceOrganization(
    session,
    options?.organizationId
  );

  if (!organization) {
    return {
      status: "empty",
      advisoryNotice:
        "Advisory forecasts only — never facts. Select an organization to forecast.",
      cards: [],
      observationId: null,
      explanation:
        "No organization is available for this session. Forecasts require bound contributor outputs.",
    };
  }

  const decisions = decisionsForOrg(organization.id, organization.name);
  const context = buildPredictionContext({
    organizationId: organization.id,
    organizationName: organization.name,
    decisions,
  });

  if (context.signals.length === 0 && context.openDecisionCount === 0) {
    return {
      status: "empty",
      advisoryNotice:
        "Advisory forecasts only — never facts. Evidence and assumptions accompany every prediction.",
      cards: [],
      observationId: null,
      explanation:
        "No bound contributor signals or decisions for this organization yet. Bind Education Intelligence snapshots to enable forecasts.",
    };
  }

  const response = PredictionService.forecast({
    context,
    kinds: options?.kinds ?? OVERVIEW_KINDS,
    horizon: options?.horizon,
  });

  if (response.observationId) {
    recordJagAuditEvent({
      action: "prediction_run",
      actorUserId: session.userId,
      actorLabel: session.displayName,
      organizationId: organization.id,
      detail: `Advisory forecast run: ${response.predictions.length} prediction(s), ${response.durationMs}ms, ${response.contributorsUsed.length} contributor(s).`,
      metadata: {
        observationId: response.observationId,
        kinds: (options?.kinds ?? OVERVIEW_KINDS).join(","),
      },
    });
  }

  return {
    status: "ready",
    advisoryNotice:
      "Advisory forecasts — not facts. Each card includes drivers, evidence-backed confidence, and assumptions in the underlying prediction.",
    cards: response.predictions.map(toCard),
    observationId: response.observationId,
    explanation: `Generated ${response.predictions.length} advisory forecast(s) in ${response.durationMs}ms using ${response.contributorsUsed.length} contributor source(s).`,
  };
}

export function loadDecisionConsequence(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisionId: string;
  readonly decisionTitle: string;
  readonly category?: string;
  readonly horizon?: PredictionHorizon;
  readonly decisions?: readonly JagDecisionCard[];
  readonly observe?: boolean;
}): DecisionConsequenceForecast {
  const decisions =
    input.decisions ??
    decisionsForOrg(input.organizationId, input.organizationName);
  const context = buildPredictionContext({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    decisions,
  });
  return PredictionService.consequenceIfNoAction({
    context,
    decisionId: input.decisionId,
    decisionTitle: input.decisionTitle,
    horizon: input.horizon ?? "30_days",
    relatedKind: kindForCategory(input.category),
    observe: input.observe,
  });
}

/**
 * Attach advisory consequences to open decision cards (no observability spam).
 */
export function attachPredictedConsequences(
  decisions: readonly JagDecisionCard[]
): JagDecisionCard[] {
  const byOrg = new Map<string, JagDecisionCard[]>();
  for (const d of decisions) {
    const list = byOrg.get(d.organizationId) ?? [];
    list.push(d);
    byOrg.set(d.organizationId, list);
  }

  const consequenceCache = new Map<string, DecisionConsequenceForecast>();

  return decisions.map((d) => {
    if (!OPEN_STATUSES.has(d.status)) {
      return { ...d, predictedConsequence: null };
    }
    const orgCards = byOrg.get(d.organizationId) ?? decisions;
    const kind = kindForCategory(d.category);
    const cacheKey = `${d.organizationId}|${kind}`;
    let forecast = consequenceCache.get(cacheKey);
    if (!forecast) {
      const context = buildPredictionContext({
        organizationId: d.organizationId,
        organizationName: d.organizationName,
        decisions: orgCards,
      });
      forecast = PredictionService.consequenceIfNoAction({
        context,
        decisionId: d.id,
        decisionTitle: d.title,
        horizon: "30_days",
        relatedKind: kind,
        observe: false,
      });
      consequenceCache.set(cacheKey, forecast);
    }
    return {
      ...d,
      predictedConsequence: {
        statement: forecast.statement.replace(
          /If this decision remains open/,
          `If “${d.title}” remains open`
        ),
        confidence: forecast.confidence,
        riskLevel: forecast.riskLevel,
        horizonLabel: forecast.horizonLabel,
        relatedPredictionKind: forecast.relatedPredictionKind,
        advisoryNotice: forecast.advisoryNotice,
      },
    };
  });
}

export function runForecastsForBriefing(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisions: readonly JagDecisionCard[];
  readonly kinds?: readonly PredictionKind[];
  readonly horizon?: PredictionHorizon;
}): {
  readonly predictions: readonly PredictionResult[];
  readonly observationId: string;
} {
  const context = buildPredictionContext({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    decisions: input.decisions,
  });
  const response = PredictionService.forecast({
    context,
    kinds: input.kinds ?? [
      "organization_health",
      "operational_readiness",
      "decision_queue_growth",
      "compliance_risk",
    ],
    horizon: input.horizon ?? "30_days",
  });
  return {
    predictions: response.predictions,
    observationId: response.observationId,
  };
}

/** Optional helper when session-wide decision projection is needed. */
export function listProjectedDecisionsForSession(
  session: JagPlatformSession
): JagDecisionCard[] {
  const organizations = listOrganizationsForSession(session);
  const orgNames = Object.fromEntries(
    organizations.map((o) => [o.id, o.name] as const)
  );
  const executions = listStoredExecutionsForOrganizations(
    organizations.map((o) => o.id),
    500
  );
  return projectDecisionsFromExecutions({
    executions,
    organizationNames: orgNames,
  });
}

function toCard(p: PredictionResult): JagForecastCard {
  return {
    id: p.id,
    kind: p.kind,
    title: p.title,
    horizonLabel: p.horizonLabel,
    trend: p.trend,
    confidence: p.confidence,
    confidenceBand: p.confidenceBand,
    riskLevel: p.riskLevel,
    drivers: p.primaryDrivers.slice(0, 3).map((d) => d.label),
    actions: p.recommendedPreventiveActions.slice(0, 3).map((a) => a.title),
    predictedSummary: p.predictedState.summary,
    advisoryNotice: p.advisoryNotice,
    insufficientData: p.insufficientData,
  };
}

function kindForCategory(category?: string): PredictionKind {
  switch (category) {
    case "funding":
      return "funding_readiness";
    case "students":
      return "student_success";
    case "operations":
      return "operational_readiness";
    case "executive":
      return "organization_health";
    default:
      return "operational_readiness";
  }
}
