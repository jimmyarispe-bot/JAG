/**
 * ECC Ask JAG — compose connectors + intelligence into Executive Copilot context.
 * No intelligence package or connector architecture changes.
 */

import { resolveAcademyOsFeed } from "@/lib/exec/academyos-feed";
import { ensureAcademyOsSynced } from "@/lib/exec/ensure-academyos";
import { ensureGoogleWorkspaceSynced } from "@/lib/exec/ensure-google-workspace";
import { ensurePlaidSynced } from "@/lib/exec/ensure-plaid";
import { ensureQuickBooksSynced } from "@/lib/exec/ensure-quickbooks";
import { ensureSquareSynced } from "@/lib/exec/ensure-square";
import {
  googleWorkspaceDataMode,
  resolveGoogleWorkspaceFeed,
} from "@/lib/exec/google-workspace-feed";
import { getExecIntelligence } from "@/lib/exec/intelligence";
import { getExecRuntime } from "@/lib/exec/scope";
import { plaidDataMode, resolvePlaidFeed } from "@/lib/exec/plaid-feed";
import { quickBooksDataMode, resolveQuickBooksFeed } from "@/lib/exec/quickbooks-feed";
import { resolveSquareFeed, squareDataMode } from "@/lib/exec/square-feed";
import type { ExecAskViewModel } from "@/lib/exec/view-models";
import {
  askCopilot,
  buildMorningBrief,
  createCopilotEngine,
  createSessionMemory,
  orderedConnectorSnapshots,
  resolveScenarioDefinition,
  snapshotAcademyOs,
  snapshotGoogleWorkspace,
  snapshotPlaid,
  snapshotQuickBooks,
  snapshotSquare,
  type CopilotAskResult,
  type CopilotContext,
  type DecisionScenarioKind,
  type SessionMemory,
} from "@/lib/platform/copilot";
import type { ExecDataMode } from "@/lib/exec/data-mode";

function mergeDataMode(modes: ExecDataMode[]): ExecDataMode {
  const unique = new Set(modes.filter(Boolean));
  if (unique.size === 0) return "model-baseline";
  if (unique.size === 1) return [...unique][0]!;
  // Prefer live when any connector is live; otherwise cached over baseline.
  if (unique.has("live")) return "live";
  if (unique.has("cached")) return "cached";
  if (unique.has("synthetic")) return "synthetic";
  return "model-baseline";
}

export async function buildCopilotContext(): Promise<CopilotContext> {
  const runtime = await getExecRuntime();
  const orgId = runtime.scope.organizationId;
  const [, sqEnsure, qbEnsure, plaidEnsure, gwEnsure] = await Promise.all([
    ensureAcademyOsSynced(),
    ensureSquareSynced(),
    ensureQuickBooksSynced(),
    ensurePlaidSynced(),
    ensureGoogleWorkspaceSynced(),
  ]);

  const feed = resolveAcademyOsFeed(orgId);
  const square = resolveSquareFeed(orgId);
  const qb = resolveQuickBooksFeed(orgId);
  const plaid = resolvePlaidFeed(orgId);
  const google = resolveGoogleWorkspaceFeed(orgId);

  const modes = mergeDataMode([
    feed ? "live" : "model-baseline",
    squareDataMode(square, sqEnsure.freshlySynced),
    quickBooksDataMode(qb, qbEnsure.freshlySynced),
    plaidDataMode(plaid, plaidEnsure.freshlySynced),
    googleWorkspaceDataMode(google, gwEnsure.freshlySynced),
  ]);

  const intelligence = getExecIntelligence();
  const scope = { ...runtime.scope };
  const requestId = `exec-ask-${Date.now()}`;

  const oios = intelligence.oios.service.build({ requestId: `${requestId}-oios`, scope });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
    oiosResult: oios,
    humanCapitalResult: feed?.softLights.humanCapital,
    operationsResult: feed?.softLights.operations ?? google?.softLights.operations,
    stakeholderResult: feed
      ? {
          healthScore: { value: feed.enrollmentScore },
          engagementScore: { value: feed.enrollmentScore },
        }
      : google
        ? {
            healthScore: { value: google.collaborationScore },
            engagementScore: { value: google.collaborationScore },
          }
        : square
          ? {
              healthScore: { value: square.customerScore },
              engagementScore: { value: square.customerScore },
            }
          : undefined,
  });
  const opportunity = intelligence.opportunity.service.build({
    requestId: `${requestId}-opp`,
    scope,
  });

  const predictive = intelligence.predictiveIntelligence.service.predict({
    requestId: `${requestId}-pred`,
    question: "Executive baseline forecast for Ask JAG",
    scope,
  });

  const connectors = orderedConnectorSnapshots({
    academyos: snapshotAcademyOs(feed),
    quickbooks: snapshotQuickBooks(qb),
    square: snapshotSquare(square),
    plaid: snapshotPlaid(plaid),
    googleWorkspace: snapshotGoogleWorkspace(google),
  });

  const domainsUsed = [
    "wisdom",
    "oios-core",
    "opportunity",
    "predictive",
    ...(feed ? ["academyos", "human-capital", "operations"] : []),
    ...(qb ? ["quickbooks", "financial"] : []),
    ...(square ? ["square", "customer", "revenue"] : []),
    ...(plaid ? ["plaid", "financial", "resilience"] : []),
    ...(google ? ["google-workspace", "operations", "stakeholder"] : []),
  ];

  return {
    organizationId: orgId,
    executiveRole: "CEO",
    generatedAt: new Date().toISOString(),
    connectors,
    dataMode: modes,
    intelligence: {
      domainsUsed,
      wisdomHeadline: wisdom.brief.headline,
      wisdomOutlook: wisdom.brief.outlook,
      opportunityHeadlines: (opportunity.exchange ?? [])
        .slice(0, 5)
        .map((o) => o.title),
      riskHeadlines: wisdom.risks.slice(0, 5).map((r) => r.title),
      predictiveHeadline: predictive.projection?.headline ?? predictive.question,
      judgment: wisdom.brief.judgment,
      recommendations: wisdom.recommendations.slice(0, 8).map((r) => ({
        id: r.id,
        title: r.title,
        action: r.action,
        rationale: r.rationale,
        narrative: r.narrative,
        priority: r.priority,
        confidenceScore: r.confidenceScore,
        evidenceRefs: r.evidenceRefs,
        lenses: r.lenses,
      })),
    },
  };
}

function createSoftPredictive(scope: { organizationId: string; schoolId: string | null }) {
  return function softPredictive(question: string, kind?: DecisionScenarioKind) {
    const intelligence = getExecIntelligence();
    const resolved = resolveScenarioDefinition(question, kind);
    const result = intelligence.predictiveIntelligence.service.predict({
      requestId: `exec-ask-sim-${Date.now()}`,
      question,
      scenarios: [resolved.definition],
      scope: { ...scope },
    });
    const primary = result.scenarioForecasts[0];
    return {
      headline: result.projection?.headline ?? primary?.summary ?? question,
      summary: primary?.summary ?? result.question,
      confidence: primary?.confidence.value ?? 0.55,
      domains: (primary?.domains ?? []).slice(0, 6).map((d) => ({
        domain: d.domain,
        direction: d.trend.direction,
        narrative: d.summary || d.trend.narrative,
        confidence: d.confidence.value,
      })),
      risks: (primary?.emergingRisks ?? []).slice(0, 4).map((r) => r.title),
    };
  };
}

export async function loadExecAsk(): Promise<ExecAskViewModel> {
  const context = await buildCopilotContext();
  const session = createSessionMemory({
    organizationId: context.organizationId,
    executiveRole: context.executiveRole,
  });
  const brief = buildMorningBrief(context, session);
  const engine = createCopilotEngine({
    getPredictive: createSoftPredictive({
      organizationId: context.organizationId,
      schoolId: null,
    }),
  });
  const opener = engine.ask(context, {
    question: "Daily brief",
    intentHint: "daily_brief",
    session,
  });

  return {
    generatedAt: context.generatedAt,
    dataMode: context.dataMode,
    organizationId: context.organizationId,
    executiveRole: context.executiveRole,
    brief: {
      headline: brief.headline,
      cash: brief.cash,
      revenue: brief.revenue,
      workforce: brief.workforce,
      topOpportunities: brief.topOpportunities,
      topRisks: brief.topRisks,
      meetings: brief.meetings,
      deadlines: brief.deadlines,
    },
    systemsPresent: brief.evidenceChain.systemsPresent,
    systemsMissing: brief.evidenceChain.systemsMissing,
    opener,
    session: opener.memory,
    suggestedPrompts: [
      "Why is cash down this month?",
      "Show evidence",
      "Explain the top recommendation",
      "What happens if we raise tuition 5%?",
      "Compare options",
      "Prepare board meeting",
      "Summarize this week",
      "What changed?",
    ],
  };
}

export async function execAskQuestion(input: {
  question: string;
  session?: SessionMemory;
  intentHint?: CopilotAskResult["intent"];
  recommendationId?: string;
}): Promise<CopilotAskResult> {
  const context = await buildCopilotContext();
  return askCopilot(
    context,
    {
      question: input.question,
      session: input.session,
      intentHint: input.intentHint,
      recommendationId: input.recommendationId,
      organizationId: context.organizationId,
      executiveRole: context.executiveRole,
    },
    {
      getPredictive: createSoftPredictive({
        organizationId: context.organizationId,
        schoolId: null,
      }),
    }
  );
}
