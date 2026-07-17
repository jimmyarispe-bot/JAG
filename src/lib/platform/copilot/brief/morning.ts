/**
 * Executive morning brief — opportunities, risks, cash, revenue, workforce, meetings, deadlines, actions.
 */

import { buildEvidenceChainFromContext } from "../evidence/chain";
import { allRecommendations, primaryRecommendation } from "../recommendation/framework";
import type { CopilotContext, ExecutiveMorningBrief, SessionMemory } from "../types";

function metricValue(
  context: CopilotContext,
  systems: string[],
  keys: string[]
): string {
  for (const system of systems) {
    const snap = context.connectors.find((c) => c.system === system && c.connected);
    if (!snap) continue;
    for (const key of keys) {
      const m = snap.metrics.find((x) => x.key === key);
      if (m && m.value != null) {
        const n = typeof m.value === "number" ? m.value.toLocaleString() : String(m.value);
        return `${m.label}: ${n} (${system})`;
      }
    }
  }
  return "Not available — required connector offline or metric missing.";
}

function meetingsFromContext(context: CopilotContext): string[] {
  const gw = context.connectors.find((c) => c.system === "google-workspace");
  if (!gw?.connected) return ["Google Workspace not connected — meetings unavailable."];
  const fromBullets = gw.bullets.filter((b) => /meeting|calendar|next:/i.test(b)).slice(0, 4);
  return fromBullets.length
    ? fromBullets
    : [`${gw.metrics.find((m) => m.key === "upcomingMeetings")?.value ?? 0} upcoming meetings (Workspace).`];
}

function deadlinesFromContext(context: CopilotContext, memory?: SessionMemory): string[] {
  const fromMemory = memory?.pendingActions.slice(0, 3) ?? [];
  const gw = context.connectors.find((c) => c.system === "google-workspace");
  const taskHint =
    gw?.connected && gw.metrics.find((m) => m.key === "openTasks")
      ? [`${gw.metrics.find((m) => m.key === "openTasks")?.value ?? 0} open Workspace tasks`]
      : [];
  const recs = context.intelligence.recommendations
    .slice(0, 2)
    .map((r) => `${r.title} (${r.priority})`);
  const merged = [...fromMemory, ...taskHint, ...recs];
  return merged.length ? merged.slice(0, 6) : ["No pending deadlines in session memory."];
}

export function buildMorningBrief(
  context: CopilotContext,
  memory?: SessionMemory
): ExecutiveMorningBrief {
  const actions = allRecommendations(context).slice(0, 5);
  const primary = primaryRecommendation(context);
  const evidenceChain = buildEvidenceChainFromContext(
    context,
    primary?.title ?? "Morning brief",
    primary?.suggestedAction ?? "Review top opportunities and risks.",
    context.intelligence.judgment?.why
  );

  return {
    generatedAt: context.generatedAt,
    headline:
      context.intelligence.wisdomHeadline ||
      primary?.executiveSummary ||
      "Executive morning brief ready.",
    topOpportunities:
      context.intelligence.opportunityHeadlines.slice(0, 5).length > 0
        ? context.intelligence.opportunityHeadlines.slice(0, 5)
        : ["No opportunity headlines from intelligence in this session."],
    topRisks:
      context.intelligence.riskHeadlines.slice(0, 5).length > 0
        ? context.intelligence.riskHeadlines.slice(0, 5)
        : ["No risk headlines from intelligence in this session."],
    cash: metricValue(context, ["plaid", "quickbooks", "academyos"], [
      "availableCash",
      "cash",
      "forecast30d",
    ]),
    revenue: metricValue(context, ["quickbooks", "square", "academyos"], [
      "revenue",
      "volume7d",
      "ebitda",
    ]),
    workforce: metricValue(context, ["academyos", "google-workspace"], [
      "workforceScore",
      "students",
      "openTasks",
    ]),
    meetings: meetingsFromContext(context),
    deadlines: deadlinesFromContext(context, memory),
    recommendedActions: actions,
    evidenceChain,
    dataMode: context.dataMode,
  };
}

export function formatBriefAnswer(brief: ExecutiveMorningBrief): string {
  const lines = [
    brief.headline,
    "",
    `Cash: ${brief.cash}`,
    `Revenue: ${brief.revenue}`,
    `Workforce: ${brief.workforce}`,
    "",
    "Top opportunities:",
    ...brief.topOpportunities.map((o) => `• ${o}`),
    "",
    "Top risks:",
    ...brief.topRisks.map((r) => `• ${r}`),
    "",
    "Meetings:",
    ...brief.meetings.map((m) => `• ${m}`),
    "",
    "Recommended actions:",
    ...brief.recommendedActions.map((a) => `• ${a.title}: ${a.suggestedAction}`),
  ];
  return lines.join("\n");
}
