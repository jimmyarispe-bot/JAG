/**
 * Executive conversation engine — intent → evidence-backed answer.
 */

import { buildMorningBrief, formatBriefAnswer } from "../brief/morning";
import { buildEvidenceChainFromContext } from "../evidence/chain";
import {
  allRecommendations,
  primaryRecommendation,
  recommendationFromWisdom,
} from "../recommendation/framework";
import {
  buildSimulationResult,
  type PredictiveSoftResult,
} from "../simulator/engine";
import { isSimulationIntent, routeIntent } from "./intents";
import {
  applyTurnMemory,
  createSessionMemory,
} from "./memory";
import type {
  CopilotAskRequest,
  CopilotAskResult,
  CopilotContext,
  CopilotIntent,
  CopilotRecommendation,
  ExplainabilityBundle,
} from "../types";

function emptyExplainability(summary: string): ExplainabilityBundle {
  return {
    explain: summary,
    evidence: [],
    assumptions: ["Insufficient recommendation context for full explainability."],
    calculations: [],
    confidence: { value: 0, level: "unknown", rationale: "No primary recommendation." },
    alternatives: [],
  };
}

function findRecommendation(
  context: CopilotContext,
  id?: string | null
): CopilotRecommendation | null {
  if (!id) return primaryRecommendation(context);
  const all = allRecommendations(context);
  return all.find((r) => r.id === id || r.sourceRecommendationId === id) ?? primaryRecommendation(context);
}

function answerWhy(context: CopilotContext, question: string, rec: CopilotRecommendation | null): string {
  const connectors = context.connectors.filter((c) => c.connected);
  const cashBits = connectors
    .filter((c) => ["plaid", "quickbooks", "square"].includes(c.system))
    .flatMap((c) => c.bullets.slice(0, 1));

  if (/cash/i.test(question)) {
    const parts = [
      "Cash posture (evidence-backed):",
      ...cashBits.map((b) => `• ${b}`),
      rec ? `Wisdom judgment: ${rec.reasoning.whyItHappened}` : null,
      rec ? `Why it matters: ${rec.reasoning.whyItMatters}` : null,
      connectors.length === 0
        ? "No live finance connectors — cannot cite Plaid/QuickBooks/Square cash evidence."
        : null,
    ].filter(Boolean);
    return parts.join("\n");
  }

  if (!rec) {
    return [
      "Unable to form a grounded why-answer without wisdom recommendations.",
      `Connected systems: ${connectors.map((c) => c.system).join(", ") || "none"}.`,
    ].join(" ");
  }

  return [
    `What happened: ${rec.reasoning.whatHappened}`,
    `Why: ${rec.reasoning.whyItHappened}`,
    `Why it matters: ${rec.reasoning.whyItMatters}`,
    `Suggested action: ${rec.suggestedAction}`,
    `Confidence: ${rec.confidence.level} (${Math.round(rec.confidence.value * 100)}%)`,
  ].join("\n");
}

function answerWhatChanged(context: CopilotContext): string {
  const bullets = context.connectors
    .filter((c) => c.connected)
    .flatMap((c) => c.bullets.slice(0, 2).map((b) => `[${c.system}] ${b}`));
  const intel = [
    context.intelligence.wisdomHeadline
      ? `Wisdom: ${context.intelligence.wisdomHeadline}`
      : null,
    ...context.intelligence.opportunityHeadlines.slice(0, 2).map((o) => `Opportunity: ${o}`),
    ...context.intelligence.riskHeadlines.slice(0, 2).map((r) => `Risk: ${r}`),
  ].filter(Boolean);

  if (bullets.length === 0 && intel.length === 0) {
    return "No connector or intelligence deltas available in this session.";
  }
  return ["What changed (grounded signals):", ...bullets, ...intel].join("\n");
}

function answerCompare(context: CopilotContext, recs: CopilotRecommendation[]): string {
  if (recs.length < 2) {
    const one = recs[0];
    return one
      ? `Only one recommendation available to compare:\n• ${one.title} — ${one.suggestedAction}\nAlternatives: ${one.alternatives.join("; ")}`
      : "No recommendations available to compare.";
  }
  return [
    "Compare options (evidence-backed):",
    ...recs.slice(0, 4).map(
      (r, i) =>
        `${i + 1}. ${r.title} [${r.confidence.level}]\n   Action: ${r.suggestedAction}\n   Trade-offs: ${r.tradeOffs[0] ?? "—"}\n   Financial: ${r.financialImpact}`
    ),
  ].join("\n");
}

function answerBoard(context: CopilotContext, recs: CopilotRecommendation[]): string {
  const brief = buildMorningBrief(context);
  return [
    "Board meeting pack (draft from connected systems + wisdom):",
    `Headline: ${brief.headline}`,
    `Cash: ${brief.cash}`,
    `Revenue: ${brief.revenue}`,
    `Workforce: ${brief.workforce}`,
    "",
    "Decisions for the board:",
    ...recs.slice(0, 5).map((r) => `• ${r.title}: ${r.suggestedAction} (${r.confidence.level} confidence)`),
    "",
    "Risks:",
    ...brief.topRisks.map((r) => `• ${r}`),
    "",
    "Evidence systems present:",
    brief.evidenceChain.systemsPresent.join(" → "),
  ].join("\n");
}

function answerSummary(context: CopilotContext, horizon: "week" | "month"): string {
  const brief = buildMorningBrief(context);
  return [
    `Summary — this ${horizon} (from current connector + intelligence snapshot):`,
    brief.headline,
    `Cash: ${brief.cash}`,
    `Revenue: ${brief.revenue}`,
    `Workforce: ${brief.workforce}`,
    "Opportunities: " + brief.topOpportunities.join("; "),
    "Risks: " + brief.topRisks.join("; "),
    "Note: Horizon summaries reuse the latest grounded sync — historical period rolls require KPI snapshot history when available.",
  ].join("\n");
}

export type ConversationEngineOptions = {
  /** Soft predictive result for simulation intents (from ECC predictive.service.predict). */
  predictive?: PredictiveSoftResult | null;
};

export function runConversation(
  context: CopilotContext,
  request: CopilotAskRequest,
  options: ConversationEngineOptions = {}
): CopilotAskResult {
  const intent = routeIntent(request.question, request.intentHint);
  let memory =
    request.session ??
    createSessionMemory({
      organizationId: request.organizationId ?? context.organizationId,
      executiveRole: request.executiveRole ?? context.executiveRole,
    });

  const recs = allRecommendations(context);
  let recommendation =
    findRecommendation(context, request.recommendationId ?? memory.lastRecommendationId) ??
    recs[0] ??
    null;
  let scenario = null as CopilotAskResult["scenario"];
  let answer = "";
  let explainability: ExplainabilityBundle =
    recommendation?.explainability ?? emptyExplainability("No recommendation.");
  let evidenceChain =
    recommendation?.evidenceChain ??
    buildEvidenceChainFromContext(
      context,
      "Conversation",
      "No recommendation formed.",
      context.intelligence.judgment?.why
    );

  if (isSimulationIntent(intent) || intent === "decision_simulator") {
    scenario = buildSimulationResult({
      context,
      question: request.question,
      predictive: options.predictive ?? {
        headline: context.intelligence.predictiveHeadline || "Predictive baseline scenario",
        summary:
          "Predictive soft projection composed for executive simulation (inject full predict() result for richer domain impacts).",
        confidence: 0.55,
        domains: [],
        risks: context.intelligence.riskHeadlines.slice(0, 3),
      },
    });
    recommendation = scenario.recommendation;
    evidenceChain = scenario.evidenceChain;
    explainability = recommendation.explainability;
    answer = [
      scenario.summary,
      `Wisdom: ${scenario.wisdomJudgment}`,
      `Confidence: ${scenario.confidence.level}`,
      "Domain impacts:",
      ...(scenario.domainImpacts.length
        ? scenario.domainImpacts.map(
            (d) => `• ${d.domain} (${d.direction}): ${d.narrative}`
          )
        : ["• Domain-level impacts pending richer predictive injection."]),
      "Risks:",
      ...scenario.risks.map((r) => `• ${r}`),
      "Alternatives:",
      ...scenario.alternatives.map((a) => `• ${a}`),
    ].join("\n");
  } else {
    switch (intent as CopilotIntent) {
      case "daily_brief": {
        const brief = buildMorningBrief(context, memory);
        answer = formatBriefAnswer(brief);
        evidenceChain = brief.evidenceChain;
        recommendation = brief.recommendedActions[0] ?? recommendation;
        explainability = recommendation?.explainability ?? explainability;
        break;
      }
      case "show_evidence": {
        answer = [
          "Evidence chain (AcademyOS → QuickBooks → Square → Plaid → Google Workspace → Intelligence → Reasoning → Recommendation):",
          ...evidenceChain.links.map(
            (l) =>
              `• [${l.system}] ${l.grounded ? "✓" : "✗"} ${l.statement}`
          ),
          `Grounded: ${evidenceChain.groundedCount} · Missing: ${evidenceChain.systemsMissing.join(", ") || "none"}`,
        ].join("\n");
        break;
      }
      case "explain_recommendation": {
        if (!recommendation) {
          answer = "No recommendation available to explain.";
        } else {
          explainability = recommendation.explainability;
          answer = [
            `Explain: ${explainability.explain}`,
            "",
            "Evidence:",
            ...explainability.evidence.map((e) => `• ${e}`),
            "",
            "Assumptions:",
            ...explainability.assumptions.map((a) => `• ${a}`),
            "",
            "Calculations:",
            ...explainability.calculations.map((c) => `• ${c}`),
            "",
            `Confidence: ${explainability.confidence.level} — ${explainability.confidence.rationale}`,
            "",
            "Alternatives:",
            ...explainability.alternatives.map((a) => `• ${a}`),
          ].join("\n");
        }
        break;
      }
      case "why":
        answer = answerWhy(context, request.question, recommendation);
        break;
      case "why_not":
        answer = recommendation
          ? [
              `Why not (alternatives / deferrals):`,
              ...recommendation.alternatives.map((a) => `• ${a}`),
              `Risks remaining: ${recommendation.riskImpact}`,
              `Trade-offs: ${recommendation.tradeOffs.join("; ")}`,
            ].join("\n")
          : "No recommendation alternatives available.";
        break;
      case "what_changed":
        answer = answerWhatChanged(context);
        break;
      case "compare_options":
        answer = answerCompare(context, recs);
        break;
      case "prepare_board_meeting":
        answer = answerBoard(context, recs);
        break;
      case "summarize_week":
        answer = answerSummary(context, "week");
        break;
      case "summarize_month":
        answer = answerSummary(context, "month");
        break;
      case "ask_anything":
      default: {
        if (/cash/i.test(request.question)) {
          answer = answerWhy(context, request.question, recommendation);
        } else if (recommendation) {
          answer = [
            recommendation.executiveSummary,
            "",
            `What happened: ${recommendation.reasoning.whatHappened}`,
            `Why: ${recommendation.reasoning.whyItHappened}`,
            `Why it matters: ${recommendation.reasoning.whyItMatters}`,
            `What to do: ${recommendation.suggestedAction}`,
            `Why now: ${recommendation.reasoning.whyNow}`,
            `Confidence: ${recommendation.confidence.level}`,
            "",
            "Ask «show evidence» or «explain» for the full chain.",
          ].join("\n");
        } else {
          answer =
            "I could not form an evidence-backed recommendation from current connector and intelligence inputs.";
        }
        break;
      }
    }
  }

  // Wisdom query enrichment path when ask_anything and we have a narrative
  if (intent === "ask_anything" && context.intelligence.recommendations[1] && !scenario) {
    const secondary = recommendationFromWisdom(
      context,
      context.intelligence.recommendations[1],
      1
    );
    if (!recs.find((r) => r.id === secondary.id)) {
      recs.push(secondary);
    }
  }

  memory = applyTurnMemory(
    memory,
    request.question,
    intent,
    recommendation?.id ?? null,
    recommendation?.suggestedAction,
    scenario ? `Simulate: ${scenario.title}` : undefined
  );

  return {
    id: `turn-${Date.now()}`,
    at: new Date().toISOString(),
    intent,
    question: request.question,
    answer,
    recommendation,
    recommendations: recs,
    evidenceChain,
    explainability,
    scenario,
    memory,
  };
}
