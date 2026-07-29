/**
 * Build structured, evidence-grounded conversation answers.
 * Never invents metrics — empty / unbound states are stated explicitly.
 */

import { filterJagSearchCatalog } from "../search-filter";
import type { ConversationGroundingContext } from "./context";
import type { RoutedIntent } from "./intents";
import type {
  JagConversationAnswer,
  JagConversationEntityLink,
  JagConversationEvidenceItem,
} from "./types";

const ADVISORY =
  "Evidence-backed executive answer — not a chatbot reply. Unbound signals are stated as empty, never fabricated.";

type BaseMeta = {
  readonly forecasts: readonly JagConversationEntityLink[];
  readonly scenarios: readonly JagConversationEntityLink[];
  readonly relatedPolicies: readonly JagConversationEntityLink[];
  readonly relatedKnowledge: readonly JagConversationEntityLink[];
};

function band(c: number): "low" | "moderate" | "high" | "none" {
  if (c <= 0) return "none";
  if (c >= 0.7) return "high";
  if (c >= 0.45) return "moderate";
  return "low";
}

function avg(nums: readonly number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function decisionLink(d: {
  id: string;
  title: string;
  priority?: string;
}): JagConversationEntityLink {
  return {
    id: d.id,
    kind: "decision",
    label: d.title,
    href: `/jag/decisions/${d.id}`,
    subtitle: d.priority,
  };
}

function emptyAnswer(
  summary: string,
  extras?: Partial<JagConversationAnswer>
): JagConversationAnswer {
  return {
    executiveSummary: summary,
    evidence: [],
    confidence: 0,
    confidenceBand: "none",
    confidenceExplanation:
      "No confidence — required bound evidence is missing for this question.",
    primaryDrivers: [],
    supportingContributors: [],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: [],
    forecasts: [],
    scenarios: [],
    recommendedNextActions: [
      "Bind Education contributor outputs for this organization.",
      "Open Decision Center or Scenario Planner for related executive work.",
    ],
    suggestedFollowUps: [
      "What should I decide today?",
      "Which forecasts deserve attention?",
    ],
    reasoningChain: [
      "Routed question to Command Center loaders.",
      "No sufficient bound evidence matched the intent.",
      "Returned explicit insufficient-data answer (no fabrication).",
    ],
    timeline: [],
    policyTrace: [],
    contributorTrace: [],
    dependencies: [],
    insufficientData: true,
    advisoryNotice: ADVISORY,
    ...extras,
  };
}

export function buildConversationAnswer(input: {
  readonly question: string;
  readonly routed: RoutedIntent;
  readonly context: ConversationGroundingContext;
  readonly priorTopics: readonly string[];
}): JagConversationAnswer {
  const { routed, context, question, priorTopics } = input;
  const orgLabel = context.organizationName ?? "this organization";

  const catalogPolicies = context.searchCatalog
    .filter((i) => i.kind === "policy")
    .slice(0, 4)
    .map(
      (i): JagConversationEntityLink => ({
        id: i.id,
        kind: "policy",
        label: i.title,
        href: i.href,
        subtitle: i.subtitle,
      })
    );
  const catalogKnowledge = context.searchCatalog
    .filter((i) => i.kind === "knowledge")
    .slice(0, 4)
    .map(
      (i): JagConversationEntityLink => ({
        id: i.id,
        kind: "knowledge",
        label: i.title,
        href: i.href,
        subtitle: i.subtitle,
      })
    );

  const baseMeta: BaseMeta = {
    relatedPolicies: catalogPolicies,
    relatedKnowledge: catalogKnowledge,
    scenarios: context.scenarioTemplates.slice(0, 4).map(
      (t): JagConversationEntityLink => ({
        id: `scenario:${t.kind}`,
        kind: "scenario" as const,
        label: t.title,
        href: context.organizationId
          ? `/jag/scenarios?org=${encodeURIComponent(context.organizationId)}&kind=${encodeURIComponent(t.kind)}`
          : "/jag/scenarios",
      })
    ),
    forecasts: context.forecasts.slice(0, 6).map(
      (f): JagConversationEntityLink => ({
        id: f.id,
        kind: "forecast" as const,
        label: f.title,
        href: "/jag#forecasts",
        subtitle: `${f.trend} · ${(f.confidence * 100).toFixed(0)}%`,
      })
    ),
  };

  switch (routed.intent) {
    case "decide_today":
      return answerDecideToday(context, orgLabel, baseMeta);
    case "overdue_decisions":
      return answerOverdue(context, orgLabel, baseMeta);
    case "organization_health":
      return answerHealth(context, orgLabel, baseMeta, priorTopics);
    case "what_changed":
      return answerWhatChanged(context, orgLabel, baseMeta);
    case "highest_risk":
      return answerHighestRisk(context, orgLabel, baseMeta);
    case "forecasts_attention":
      return answerForecasts(context, orgLabel, baseMeta);
    case "high_confidence_recommendations":
      return answerHighConfidence(context, orgLabel, baseMeta);
    case "delay_decision":
      return answerDelay(context, orgLabel, baseMeta);
    case "funding":
      return answerTopic(context, orgLabel, baseMeta, "funding", priorTopics);
    case "student_success":
      return answerTopic(context, orgLabel, baseMeta, "student_success", priorTopics);
    case "scenario_what_if":
      return answerScenarios(context, orgLabel, baseMeta);
    case "briefings":
      return answerBriefings(context, orgLabel, baseMeta);
    case "search":
      return answerSearch(context, question, baseMeta);
    case "follow_up":
      return answerFollowUp(context, orgLabel, baseMeta, priorTopics);
    case "insufficient":
      return emptyAnswer("Ask an executive question about decisions, health, forecasts, or scenarios.");
    case "general_status":
    default:
      return answerGeneral(context, orgLabel, baseMeta);
  }
}

function answerDecideToday(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const top = ctx.openDecisions
    .slice()
    .sort((a, b) => a.priorityRank - b.priorityRank)
    .slice(0, 5);
  if (top.length === 0) {
    return emptyAnswer(
      `No open decisions are bound for ${orgLabel}. Decision Center is empty until contributor action proposals are recorded.`,
      {
        relatedPolicies: baseMeta.relatedPolicies,
        relatedKnowledge: baseMeta.relatedKnowledge,
        recommendedNextActions: [
          "Bind Education intelligence snapshots with suggested actions.",
          "Open Decision Center to confirm the queue is empty.",
        ],
        suggestedFollowUps: [
          "Which forecasts deserve attention?",
          "Why is organization health declining?",
        ],
      }
    );
  }
  const conf = avg(top.map((d) => d.confidence));
  const evidence: JagConversationEvidenceItem[] = top.map((d) => ({
    id: `ev-dec-${d.id}`,
    source: d.contributorLabel,
    summary: `${d.title} · ${d.priority} · ${d.status}`,
    kind: "observed",
    href: `/jag/decisions/${d.id}`,
    confidence: d.confidence,
  }));
  return {
    executiveSummary: `For ${orgLabel}, prioritize ${top.length} open decision(s). Top: ${top
      .map((d) => d.title)
      .join("; ")}.`,
    evidence,
    confidence: Number(conf.toFixed(3)),
    confidenceBand: band(conf),
    confidenceExplanation: `Confidence from ${top.length} bound decision proposal(s) with average contributor confidence ${(conf * 100).toFixed(0)}%.`,
    primaryDrivers: top.slice(0, 3).map((d) => ({
      label: d.title,
      explanation: d.rationale || d.recommendedAction,
    })),
    supportingContributors: [...new Set(top.map((d) => d.contributorId))],
    relatedPolicies: baseMeta.relatedPolicies,
    relatedKnowledge: baseMeta.relatedKnowledge,
    relatedDecisions: top.map(decisionLink),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      `Review ${top[0]!.title} in Decision Center.`,
      "Assign owners for P1 items still unassigned.",
      "Run Scenario Planner what-if before approving high-impact items.",
    ],
    suggestedFollowUps: [
      "Which decisions are overdue?",
      "What happens if we delay this decision?",
      "Show only high-confidence recommendations.",
    ],
    reasoningChain: [
      "Intent: decide_today.",
      "Loaded Decision Center open queue (bound proposals only).",
      "Ranked by priority; cited contributor confidence.",
    ],
    timeline: top.slice(0, 4).map((d) => ({
      at: d.analyzedAt,
      message: `${d.title} entered queue from ${d.contributorLabel}`,
    })),
    policyTrace: baseMeta.relatedPolicies.map((p) => p.label),
    contributorTrace: [...new Set(top.map((d) => d.contributorId))],
    dependencies: top.flatMap((d) =>
      d.predictedConsequence ? [d.predictedConsequence.statement] : []
    ).slice(0, 3),
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerOverdue(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const overdue = ctx.overdueDecisions;
  if (overdue.length === 0) {
    return emptyAnswer(
      `No overdue decisions for ${orgLabel} in the bound Decision Center queue.`,
      {
        ...baseMeta,
        relatedDecisions: ctx.openDecisions.slice(0, 3).map(decisionLink),
        confidenceExplanation: "Queue inspected; zero overdue flags.",
        insufficientData: false,
        confidence: ctx.openDecisions.length > 0 ? 0.7 : 0,
        confidenceBand: ctx.openDecisions.length > 0 ? "moderate" : "none",
        executiveSummary: `No overdue decisions for ${orgLabel}.`,
        recommendedNextActions: ["Continue triage of open non-overdue decisions."],
        suggestedFollowUps: ["What should I decide today?"],
        reasoningChain: ["Intent: overdue_decisions.", "Filtered open decisions by isOverdue."],
        advisoryNotice: ADVISORY,
        primaryDrivers: [],
        supportingContributors: [],
        relatedPolicies: [],
        relatedKnowledge: [],
        evidence: [],
        timeline: [],
        policyTrace: [],
        contributorTrace: [],
        dependencies: [],
      }
    );
  }
  const conf = avg(overdue.map((d) => d.confidence));
  return {
    executiveSummary: `${overdue.length} overdue decision(s) for ${orgLabel}: ${overdue
      .map((d) => d.title)
      .join("; ")}.`,
    evidence: overdue.map((d) => ({
      id: `ev-od-${d.id}`,
      source: "Decision Center",
      summary: `${d.title} is overdue${d.assignment?.dueDate ? ` (due ${d.assignment.dueDate.slice(0, 10)})` : ""}.`,
      kind: "observed" as const,
      href: `/jag/decisions/${d.id}`,
      confidence: d.confidence,
    })),
    confidence: Number(conf.toFixed(3)),
    confidenceBand: band(conf),
    confidenceExplanation: "Confidence from overdue decision proposal records.",
    primaryDrivers: overdue.slice(0, 3).map((d) => ({
      label: d.title,
      explanation: d.isOverdue ? "Past due date while still open." : d.rationale,
    })),
    supportingContributors: [...new Set(overdue.map((d) => d.contributorId))],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: overdue.map(decisionLink),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      "Assign or complete the oldest overdue P1 first.",
      "Open Scenario Planner to model deferral cost if still blocked.",
    ],
    suggestedFollowUps: [
      "What happens if we delay this decision?",
      "What should I decide today?",
    ],
    reasoningChain: [
      "Intent: overdue_decisions.",
      "Used Decision Center isOverdue flags only — no invented due dates.",
    ],
    timeline: overdue.map((d) => ({
      at: d.assignment?.dueDate ?? d.analyzedAt,
      message: `${d.title} overdue`,
    })),
    policyTrace: [],
    contributorTrace: [...new Set(overdue.map((d) => d.contributorId))],
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerHealth(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta,
  priorTopics: readonly string[]
): JagConversationAnswer {
  const health = ctx.overview.organizationHealth;
  if (health.status !== "ready") {
    return emptyAnswer(
      `Organization health for ${orgLabel} is unbound. ${health.explanation}`,
      {
        ...baseMeta,
        suggestedFollowUps: [
          "What should I decide today?",
          "Which forecasts deserve attention?",
        ],
        reasoningChain: [
          "Intent: organization_health.",
          "School Health snapshot not bound — refused to invent a decline narrative.",
          priorTopics.includes("funding")
            ? "Prior topic funding noted but cannot link without health evidence."
            : "No prior health evidence.",
        ],
      }
    );
  }
  const conf = health.confidence ?? 0;
  const declining =
    (health.trend ?? "").toLowerCase().includes("declin") ||
    (health.overallHealth ?? "").toLowerCase().includes("risk") ||
    (health.overallHealth ?? "").toLowerCase().includes("critical");
  return {
    executiveSummary: declining
      ? `${orgLabel} health is ${health.overallHealth ?? "reported"} with trend ${health.trend ?? "n/a"} and risk ${health.riskLevel ?? "n/a"}. Drivers below are from the bound School Health assessment.`
      : `${orgLabel} health stance is ${health.overallHealth ?? "reported"} (trend ${health.trend ?? "not reported"}, risk ${health.riskLevel ?? "n/a"}).`,
    evidence: [
      {
        id: "ev-health",
        source: health.source ?? "education.cognition.school_health",
        summary: health.explanation,
        kind: "observed",
        confidence: conf,
      },
    ],
    confidence: Number(conf.toFixed(3)),
    confidenceBand: band(conf),
    confidenceExplanation:
      "Confidence taken from the bound School Health contributor result — not estimated.",
    primaryDrivers: health.primaryDrivers.map((d) => ({
      label: d,
      explanation: "Listed as a primary driver on the bound health assessment.",
    })),
    supportingContributors: ["education.cognition.school_health"],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: ctx.openDecisions.slice(0, 4).map(decisionLink),
    forecasts: baseMeta.forecasts.filter((f) =>
      /health|operational|compliance/i.test(f.label)
    ),
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      "Open Organization Health on Executive Overview.",
      "Triage related open decisions that cite health drivers.",
      priorTopics.includes("funding")
        ? "Cross-check funding forecasts against health drivers (prior conversation topic)."
        : "Ask how funding or staffing scenarios interact with this health stance.",
    ],
    suggestedFollowUps: [
      "How does that affect student success?",
      "Which forecasts deserve attention?",
      "What happens if we delay this decision?",
    ],
    reasoningChain: [
      "Intent: organization_health.",
      "Loaded bound School Health from Command Center store.",
      declining
        ? "Decline/risk language only used when present on the bound assessment."
        : "Did not claim decline without trend/stance evidence.",
    ],
    timeline: health.capturedAt
      ? [{ at: health.capturedAt, message: "School Health assessment captured" }]
      : [],
    policyTrace: [],
    contributorTrace: ["education.cognition.school_health"],
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerWhatChanged(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const execs = ctx.recentExecutions;
  if (execs.length === 0 && ctx.openDecisions.length === 0) {
    return emptyAnswer(
      `No bound contributor executions or decisions for ${orgLabel} to describe changes.`,
      { ...baseMeta }
    );
  }
  const conf = avg(execs.map((e) => e.confidence));
  return {
    executiveSummary: `Since the latest bound signals for ${orgLabel}: ${execs.length} contributor execution(s), ${ctx.openDecisions.length} open decision(s), ${ctx.overview.decisionExecution.completedThisWeek} completed this week.`,
    evidence: execs.slice(0, 6).map((e) => ({
      id: `ev-ex-${e.id}`,
      source: e.label,
      summary: e.resultSummary,
      kind: "observed" as const,
      confidence: e.confidence,
    })),
    confidence: Number((conf || 0.5).toFixed(3)),
    confidenceBand: band(conf || 0.5),
    confidenceExplanation:
      "Change narrative limited to bound executions and Decision Center metrics — no invented deltas.",
    primaryDrivers: execs.slice(0, 3).map((e) => ({
      label: e.label,
      explanation: e.resultSummary,
    })),
    supportingContributors: execs.map((e) => e.contributorId),
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: ctx.openDecisions.slice(0, 4).map(decisionLink),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      "Generate a weekly executive briefing for a structured narrative.",
      "Review Decision Center for new P1 items.",
    ],
    suggestedFollowUps: [
      "What should I decide today?",
      "Which forecasts deserve attention?",
    ],
    reasoningChain: [
      "Intent: what_changed.",
      "Used recent intelligence-store executions + decision metrics only.",
    ],
    timeline: execs.slice(0, 6).map((e) => ({
      at: e.analyzedAt,
      message: `${e.label}: ${e.resultSummary}`,
    })),
    policyTrace: [],
    contributorTrace: execs.map((e) => e.contributorId),
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerHighestRisk(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const riskyForecasts = ctx.forecasts.filter(
    (f) =>
      f.riskLevel === "elevated" ||
      f.riskLevel === "critical" ||
      f.trend === "declining"
  );
  const p1 = ctx.openDecisions.filter((d) => d.priority === "P1");
  if (
    riskyForecasts.length === 0 &&
    p1.length === 0 &&
    ctx.overview.organizationHealth.status !== "ready"
  ) {
    return emptyAnswer(
      `Insufficient bound risk signals for ${orgLabel}. Bind School Health / forecasts / P1 decisions to rank risk.`,
      { ...baseMeta }
    );
  }
  const health = ctx.overview.organizationHealth;
  const summaryParts = [
    health.status === "ready"
      ? `Health risk ${health.riskLevel ?? "n/a"} (${health.overallHealth}).`
      : null,
    riskyForecasts.length
      ? `${riskyForecasts.length} forecast(s) elevated/declining.`
      : null,
    p1.length ? `${p1.length} P1 decision(s) open.` : null,
  ].filter(Boolean);
  const conf = avg([
    ...(riskyForecasts.map((f) => f.confidence)),
    ...(p1.map((d) => d.confidence)),
    ...(typeof health.confidence === "number" ? [health.confidence] : []),
  ]);
  return {
    executiveSummary: `Highest-risk picture for ${orgLabel}: ${summaryParts.join(" ")}`,
    evidence: [
      ...riskyForecasts.slice(0, 4).map((f) => ({
        id: `ev-f-${f.id}`,
        source: f.title,
        summary: `${f.predictedSummary} (risk ${f.riskLevel})`,
        kind: "forecast" as const,
        confidence: f.confidence,
      })),
      ...p1.slice(0, 3).map((d) => ({
        id: `ev-p1-${d.id}`,
        source: d.contributorLabel,
        summary: d.title,
        kind: "observed" as const,
        href: `/jag/decisions/${d.id}`,
        confidence: d.confidence,
      })),
    ],
    confidence: Number(conf.toFixed(3)),
    confidenceBand: band(conf),
    confidenceExplanation:
      "Risk ranking uses bound forecast risk levels and P1 decisions only.",
    primaryDrivers: [
      ...riskyForecasts.slice(0, 2).map((f) => ({
        label: f.title,
        explanation: f.drivers[0] ?? f.predictedSummary,
      })),
      ...p1.slice(0, 2).map((d) => ({
        label: d.title,
        explanation: d.rationale,
      })),
    ],
    supportingContributors: [
      ...riskyForecasts.flatMap((f) => []),
      ...p1.map((d) => d.contributorId),
      ...(ctx.healthBound ? ["education.cognition.school_health"] : []),
    ],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: p1.map(decisionLink),
    forecasts: riskyForecasts.map((f) => ({
      id: f.id,
      kind: "forecast" as const,
      label: f.title,
      href: "/jag#forecasts",
      subtitle: f.riskLevel,
    })),
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      "Open Forecasts on Overview for declining items.",
      "Clear or assign P1 decisions in Decision Center.",
    ],
    suggestedFollowUps: [
      "Which forecasts deserve attention?",
      "What happens if we delay this decision?",
    ],
    reasoningChain: [
      "Intent: highest_risk.",
      "Combined forecast riskLevel/trend with P1 open decisions.",
      "Did not invent school-level rankings without bound multi-school data.",
    ],
    timeline: [],
    policyTrace: [],
    contributorTrace: p1.map((d) => d.contributorId),
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerForecasts(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const attention = ctx.forecasts
    .filter((f) => !f.insufficientData)
    .filter(
      (f) =>
        f.trend === "declining" ||
        f.riskLevel === "elevated" ||
        f.riskLevel === "critical" ||
        f.confidence >= 0.55
    )
    .slice(0, 6);
  if (attention.length === 0) {
    return emptyAnswer(
      `No advisory forecasts available for ${orgLabel} yet. Bind contributor signals, then open Forecasts.`,
      { ...baseMeta, scenarios: baseMeta.scenarios }
    );
  }
  const conf = avg(attention.map((f) => f.confidence));
  return {
    executiveSummary: `${attention.length} forecast(s) deserve attention for ${orgLabel}: ${attention
      .map((f) => `${f.title} (${f.trend}, ${(f.confidence * 100).toFixed(0)}%)`)
      .join("; ")}.`,
    evidence: attention.map((f) => ({
      id: `ev-fc-${f.id}`,
      source: f.title,
      summary: f.predictedSummary,
      kind: "forecast" as const,
      confidence: f.confidence,
    })),
    confidence: Number(conf.toFixed(3)),
    confidenceBand: band(conf),
    confidenceExplanation:
      "Forecast confidence from Predictive Intelligence Engine (advisory).",
    primaryDrivers: attention.flatMap((f) =>
      f.drivers.slice(0, 1).map((d) => ({
        label: d,
        explanation: `${f.title} driver`,
      }))
    ),
    supportingContributors: ["jag.predictive_intelligence"],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: ctx.openDecisions.slice(0, 3).map(decisionLink),
    forecasts: attention.map((f) => ({
      id: f.id,
      kind: "forecast" as const,
      label: f.title,
      href: "/jag#forecasts",
      subtitle: `${f.trend} · ${f.riskLevel}`,
    })),
    scenarios: baseMeta.scenarios,
    recommendedNextActions: attention[0]?.actions.slice(0, 2) ?? [
      "Open Scenario Planner to stress-test the top declining forecast.",
    ],
    suggestedFollowUps: [
      "What happens if we delay this decision?",
      "Why is organization health declining?",
    ],
    reasoningChain: [
      "Intent: forecasts_attention.",
      "Loaded loadForecastsView cards; filtered declining/elevated/usable confidence.",
    ],
    timeline: [],
    policyTrace: [],
    contributorTrace: ["jag.predictive_intelligence"],
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerHighConfidence(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const high = ctx.openDecisions.filter((d) => d.confidence >= 0.75);
  if (high.length === 0) {
    return emptyAnswer(
      `No open decisions with confidence ≥ 0.75 for ${orgLabel}.`,
      {
        ...baseMeta,
        relatedDecisions: ctx.openDecisions.slice(0, 3).map(decisionLink),
        recommendedNextActions: [
          "Refresh contributor runs to raise evidence confidence.",
        ],
      }
    );
  }
  const conf = avg(high.map((d) => d.confidence));
  return {
    executiveSummary: `${high.length} high-confidence recommendation(s) (≥0.75) for ${orgLabel}.`,
    evidence: high.map((d) => ({
      id: `ev-hc-${d.id}`,
      source: d.contributorLabel,
      summary: `${d.title} · confidence ${d.confidence.toFixed(2)}`,
      kind: "observed" as const,
      href: `/jag/decisions/${d.id}`,
      confidence: d.confidence,
    })),
    confidence: Number(conf.toFixed(3)),
    confidenceBand: band(conf),
    confidenceExplanation:
      "Filtered Decision Center proposals by contributor confidence ≥ 0.75.",
    primaryDrivers: high.slice(0, 3).map((d) => ({
      label: d.title,
      explanation: d.recommendedAction,
    })),
    supportingContributors: [...new Set(high.map((d) => d.contributorId))],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: high.map(decisionLink),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: high
      .slice(0, 3)
      .map((d) => `Approve or assign: ${d.title}`),
    suggestedFollowUps: [
      "What should I decide today?",
      "Which decisions are overdue?",
    ],
    reasoningChain: [
      "Intent: high_confidence_recommendations.",
      "Threshold 0.75 applied to bound proposal confidence only.",
    ],
    timeline: [],
    policyTrace: [],
    contributorTrace: [...new Set(high.map((d) => d.contributorId))],
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerDelay(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const focus =
    ctx.openDecisions.find((d) => d.priority === "P1") ?? ctx.openDecisions[0];
  if (!focus) {
    return emptyAnswer(
      `No open decision to model delay for ${orgLabel}.`,
      { ...baseMeta }
    );
  }
  const consequence = focus.predictedConsequence;
  const whatIf = focus; // card may have been enriched
  return {
    executiveSummary: consequence
      ? consequence.statement
      : `If we delay “${focus.title}”, use Decision Center what-if and Scenario Planner — no fabricated delay cost without a bound consequence forecast.`,
    evidence: [
      {
        id: `ev-delay-${focus.id}`,
        source: "Decision Center",
        summary: focus.title,
        kind: "observed",
        href: `/jag/decisions/${focus.id}`,
        confidence: focus.confidence,
      },
      ...(consequence
        ? [
            {
              id: "ev-delay-forecast",
              source: "Predictive consequence",
              summary: consequence.statement,
              kind: "forecast" as const,
              confidence: consequence.confidence,
            },
          ]
        : []),
    ],
    confidence: consequence?.confidence ?? focus.confidence,
    confidenceBand: band(consequence?.confidence ?? focus.confidence),
    confidenceExplanation: consequence
      ? "Confidence from advisory decision consequence forecast (Sprint 201)."
      : "Only decision confidence available — delay impact not projected without consequence binding.",
    primaryDrivers: [
      {
        label: focus.title,
        explanation: focus.rationale,
      },
    ],
    supportingContributors: [focus.contributorId, "jag.predictive_intelligence"],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: [decisionLink(focus)],
    forecasts: baseMeta.forecasts.filter((f) =>
      /operational|health|funding/i.test(f.label)
    ),
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      `Open what-if on decision ${focus.title}.`,
      "Compare approve vs defer vs reject in Scenario Planner.",
    ],
    suggestedFollowUps: [
      "What should I decide today?",
      "Which forecasts deserve attention?",
    ],
    reasoningChain: [
      "Intent: delay_decision.",
      "Selected top open / P1 decision.",
      consequence
        ? "Cited predictedConsequence from Decision Center enrichment."
        : "Refused to invent delay cost without consequence forecast.",
    ],
    timeline: [],
    policyTrace: [],
    contributorTrace: [focus.contributorId],
    dependencies: whatIf.predictedConsequence
      ? [whatIf.predictedConsequence.relatedPredictionKind]
      : [],
    insufficientData: !consequence,
    advisoryNotice: ADVISORY,
  };
}

function answerTopic(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta,
  topic: "funding" | "student_success",
  priorTopics: readonly string[]
): JagConversationAnswer {
  const needle = topic === "funding" ? /funding|budget/i : /student|enrollment/i;
  const forecasts = ctx.forecasts.filter(
    (f) => needle.test(f.title) || needle.test(f.kind)
  );
  const decisions = ctx.openDecisions.filter(
    (d) =>
      needle.test(d.title) ||
      needle.test(d.category) ||
      needle.test(d.contributorId)
  );
  const execs = ctx.recentExecutions.filter((e) => needle.test(e.contributorId));
  if (forecasts.length === 0 && decisions.length === 0 && execs.length === 0) {
    return emptyAnswer(
      `No bound ${topic.replace("_", " ")} signals for ${orgLabel}.${
        priorTopics.length
          ? ` Prior topics in this conversation: ${priorTopics.join(", ")}.`
          : ""
      }`,
      { ...baseMeta }
    );
  }
  const conf = avg([
    ...forecasts.map((f) => f.confidence),
    ...decisions.map((d) => d.confidence),
    ...execs.map((e) => e.confidence),
  ]);
  const linkPrior =
    priorTopics.includes("funding") && topic === "student_success"
      ? "Prior funding context is retained; student-success impact is limited to bound student/enrollment signals — no invented causal chain."
      : null;
  return {
    executiveSummary: [
      `${topic === "funding" ? "Funding" : "Student success"} signals for ${orgLabel}:`,
      forecasts.length ? `${forecasts.length} forecast(s)` : null,
      decisions.length ? `${decisions.length} related decision(s)` : null,
      execs.length ? `${execs.length} contributor execution(s)` : null,
      linkPrior,
    ]
      .filter(Boolean)
      .join(" "),
    evidence: [
      ...forecasts.map((f) => ({
        id: `ev-t-${f.id}`,
        source: f.title,
        summary: f.predictedSummary,
        kind: "forecast" as const,
        confidence: f.confidence,
      })),
      ...execs.slice(0, 3).map((e) => ({
        id: `ev-te-${e.id}`,
        source: e.label,
        summary: e.resultSummary,
        kind: "observed" as const,
        confidence: e.confidence,
      })),
    ],
    confidence: Number(conf.toFixed(3)),
    confidenceBand: band(conf),
    confidenceExplanation: `Grounded in bound ${topic.replace("_", " ")} forecasts/decisions/executions.`,
    primaryDrivers: [
      ...forecasts.slice(0, 2).flatMap((f) =>
        f.drivers.slice(0, 1).map((d) => ({ label: d, explanation: f.title }))
      ),
      ...decisions.slice(0, 2).map((d) => ({
        label: d.title,
        explanation: d.rationale,
      })),
    ],
    supportingContributors: [
      ...execs.map((e) => e.contributorId),
      ...decisions.map((d) => d.contributorId),
    ],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: decisions.map(decisionLink),
    forecasts: forecasts.map((f) => ({
      id: f.id,
      kind: "forecast" as const,
      label: f.title,
      href: "/jag#forecasts",
    })),
    scenarios: baseMeta.scenarios.filter((s) =>
      topic === "funding"
        ? /funding|budget/i.test(s.label)
        : /enrollment|teacher|campus/i.test(s.label)
    ),
    recommendedNextActions: [
      `Open Scenario Planner templates related to ${topic.replace("_", " ")}.`,
      decisions[0] ? `Review decision: ${decisions[0].title}` : "Review Forecasts on Overview.",
    ],
    suggestedFollowUps:
      topic === "funding"
        ? ["How does that affect student success?", "Which forecasts deserve attention?"]
        : ["Why is organization health declining?", "What should I decide today?"],
    reasoningChain: [
      `Intent: ${topic}.`,
      "Filtered forecasts, decisions, and executions by topic keywords.",
      linkPrior ?? "No cross-topic invention beyond retained memory topics.",
    ],
    timeline: execs.slice(0, 4).map((e) => ({
      at: e.analyzedAt,
      message: e.resultSummary,
    })),
    policyTrace: [],
    contributorTrace: execs.map((e) => e.contributorId),
    dependencies: priorTopics,
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerScenarios(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  if (baseMeta.scenarios.length === 0) {
    return emptyAnswer(`Scenario templates unavailable for ${orgLabel}.`, {
      ...baseMeta,
    });
  }
  return {
    executiveSummary: `Scenario Planner can model hypothetical changes for ${orgLabel}. Available templates: ${baseMeta.scenarios
      .map((s) => s.label)
      .join("; ")}. Projections are advisory — open /jag/scenarios to run comparisons.`,
    evidence: baseMeta.scenarios.map((s) => ({
      id: `ev-sc-${s.id}`,
      source: "Scenario Planner",
      summary: s.label,
      kind: "scenario" as const,
      href: s.href,
    })),
    confidence: 0.55,
    confidenceBand: "moderate",
    confidenceExplanation:
      "Template catalog is available; specific projection confidence requires a scenario run.",
    primaryDrivers: [
      {
        label: "Scenario templates",
        explanation: "Structured inputs drive deterministic advisory projections.",
      },
    ],
    supportingContributors: ["jag.scenario_planning"],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: ctx.openDecisions.slice(0, 3).map(decisionLink),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      "Run Hire 5 vs Hire 10 teachers comparison.",
      "Use Decision detail what-if for approve / defer / reject.",
    ],
    suggestedFollowUps: [
      "What happens if we delay this decision?",
      "Which forecasts deserve attention?",
    ],
    reasoningChain: [
      "Intent: scenario_what_if.",
      "Listed ScenarioRegistry templates — did not invent run results without execution.",
    ],
    timeline: [],
    policyTrace: [],
    contributorTrace: ["jag.scenario_planning"],
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerBriefings(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  if (ctx.briefingTitles.length === 0) {
    return emptyAnswer(
      `No executive briefings stored for ${orgLabel}. Generate one at /jag/briefings.`,
      { ...baseMeta }
    );
  }
  return {
    executiveSummary: `${ctx.briefingTitles.length} briefing(s) available for ${orgLabel}.`,
    evidence: ctx.briefingTitles.map((b) => ({
      id: `ev-br-${b.id}`,
      source: "Executive Briefings",
      summary: b.title,
      kind: "observed" as const,
      href: b.href,
    })),
    confidence: 0.7,
    confidenceBand: "moderate",
    confidenceExplanation: "Briefing archive entries are bound application records.",
    primaryDrivers: ctx.briefingTitles.slice(0, 3).map((b) => ({
      label: b.title,
      explanation: "Stored executive briefing",
    })),
    supportingContributors: ["jag.briefing_engine"],
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: ctx.openDecisions.slice(0, 3).map(decisionLink),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      `Open ${ctx.briefingTitles[0]!.title}.`,
      "Generate a weekly executive review if the archive is stale.",
    ],
    suggestedFollowUps: [
      "What should I decide today?",
      "What changed since last week?",
    ],
    reasoningChain: ["Intent: briefings.", "Listed loadBriefingList archive only."],
    timeline: [],
    policyTrace: [],
    contributorTrace: ["jag.briefing_engine"],
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

function answerSearch(
  ctx: ConversationGroundingContext,
  question: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const q = question.replace(/^(find|search|show me|where is)\s+/i, "");
  const hits = filterJagSearchCatalog(ctx.searchCatalog, q, 12);
  if (hits.length === 0) {
    return emptyAnswer(`No catalog matches for “${q.trim()}”.`, { ...baseMeta });
  }
  return {
    executiveSummary: `Found ${hits.length} catalog match(es) for “${q.trim()}”.`,
    evidence: hits.map((h) => ({
      id: `ev-hit-${h.id}`,
      source: h.kind,
      summary: `${h.title} — ${h.subtitle}`,
      kind: "observed" as const,
      href: h.href,
    })),
    confidence: 0.8,
    confidenceBand: "high",
    confidenceExplanation: "Matches from Command Center global search catalog only.",
    primaryDrivers: hits.slice(0, 3).map((h) => ({
      label: h.title,
      explanation: h.subtitle,
    })),
    supportingContributors: hits
      .filter((h) => h.kind === "contributor")
      .map((h) => h.title),
    relatedPolicies: hits
      .filter((h) => h.kind === "policy")
      .map((h) => ({
        id: h.id,
        kind: "policy" as const,
        label: h.title,
        href: h.href,
      })),
    relatedKnowledge: hits
      .filter((h) => h.kind === "knowledge")
      .map((h) => ({
        id: h.id,
        kind: "knowledge" as const,
        label: h.title,
        href: h.href,
      })),
    relatedDecisions: hits
      .filter((h) => h.kind === "decision")
      .map((h) => ({
        id: h.id,
        kind: "decision" as const,
        label: h.title,
        href: h.href,
      })),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: hits.slice(0, 3).map((h) => `Open ${h.title}`),
    suggestedFollowUps: SUGGESTED_FROM_SEARCH,
    reasoningChain: [
      "Intent: search.",
      "filterJagSearchCatalog over loadJagSearchCatalog.",
    ],
    timeline: [],
    policyTrace: hits.filter((h) => h.kind === "policy").map((h) => h.title),
    contributorTrace: hits
      .filter((h) => h.kind === "contributor")
      .map((h) => h.title),
    dependencies: [],
    insufficientData: false,
    advisoryNotice: ADVISORY,
  };
}

const SUGGESTED_FROM_SEARCH = [
  "What should I decide today?",
  "Which forecasts deserve attention?",
];

function answerFollowUp(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta,
  priorTopics: readonly string[]
): JagConversationAnswer {
  const last = priorTopics[priorTopics.length - 1];
  if (last === "funding") {
    return answerTopic(ctx, orgLabel, baseMeta, "student_success", priorTopics);
  }
  if (last === "student_success") {
    return answerHealth(ctx, orgLabel, baseMeta, priorTopics);
  }
  if (last === "organization_health") {
    return answerForecasts(ctx, orgLabel, baseMeta);
  }
  return answerGeneral(ctx, orgLabel, baseMeta);
}

function answerGeneral(
  ctx: ConversationGroundingContext,
  orgLabel: string,
  baseMeta: BaseMeta
): JagConversationAnswer {
  const health = ctx.overview.organizationHealth;
  const parts = [
    `${orgLabel}: ${ctx.openDecisions.length} open decision(s)`,
    `${ctx.overdueDecisions.length} overdue`,
    health.status === "ready"
      ? `health ${health.overallHealth}`
      : "health unbound",
    `${ctx.forecasts.filter((f) => !f.insufficientData).length} forecast(s)`,
  ];
  const conf = avg([
    ...(typeof health.confidence === "number" ? [health.confidence] : []),
    ...ctx.openDecisions.slice(0, 5).map((d) => d.confidence),
  ]);
  return {
    executiveSummary: parts.join(" · ") + ".",
    evidence: [
      {
        id: "ev-gen-metrics",
        source: "Decision Center",
        summary: `Open ${ctx.overview.decisionExecution.openDecisions}, overdue ${ctx.overview.decisionExecution.overdue}`,
        kind: "observed",
      },
      ...(health.status === "ready"
        ? [
            {
              id: "ev-gen-health",
              source: "Organization Health",
              summary: health.explanation,
              kind: "observed" as const,
              confidence: health.confidence,
            },
          ]
        : []),
    ],
    confidence: Number((conf || 0.4).toFixed(3)),
    confidenceBand: band(conf || 0.4),
    confidenceExplanation:
      "General status composed only from Overview + Decision Center bound metrics.",
    primaryDrivers: health.status === "ready"
      ? health.primaryDrivers.slice(0, 3).map((d) => ({
          label: d,
          explanation: "Bound health driver",
        }))
      : [],
    supportingContributors: ctx.recentExecutions.map((e) => e.contributorId).slice(0, 6),
    relatedPolicies: [],
    relatedKnowledge: [],
    relatedDecisions: ctx.openDecisions.slice(0, 4).map(decisionLink),
    forecasts: baseMeta.forecasts,
    scenarios: baseMeta.scenarios,
    recommendedNextActions: [
      "Ask a specific question from suggested prompts.",
      "Open Decision Center or Forecasts for detail.",
    ],
    suggestedFollowUps: [
      "What should I decide today?",
      "Which forecasts deserve attention?",
      "Why is organization health declining?",
    ],
    reasoningChain: [
      "Intent: general_status.",
      "Aggregated bound overview metrics without speculation.",
    ],
    timeline: [],
    policyTrace: [],
    contributorTrace: ctx.recentExecutions.map((e) => e.contributorId).slice(0, 6),
    dependencies: [],
    insufficientData: health.status !== "ready" && ctx.openDecisions.length === 0,
    advisoryNotice: ADVISORY,
  };
}
