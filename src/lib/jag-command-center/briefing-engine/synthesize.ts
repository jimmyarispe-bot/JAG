/**
 * Deterministic executive briefing synthesis from Command Center stores.
 * No LLM. No invented metrics. Application layer only.
 */

import { createHash } from "node:crypto";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import type { JagDecisionCard } from "../decision-center/types";
import {
  getDecisionCompletedAt,
  getDecisionFeedback,
  getDecisionOutcome,
} from "../decision-center/execution-store";
import { getDecisionTimeline } from "../decision-center/status-store";
import { loadDecisionCenter } from "../decision-center/query";
import {
  getStoredExecutiveBrief,
  getStoredSchoolHealth,
  listStoredExecutions,
  type JagStoredExecution,
  type JagStoredExecutiveBrief,
  type JagStoredSchoolHealth,
} from "../intelligence-store";
import { runForecastsForBriefing } from "../predictive/load-forecasts";
import { runHistoricalContextForBriefing } from "../memory/load-memory";
import { runStrategicAlignmentForBriefing } from "../strategy/load-strategy";
import { runBriefingScenarioAnalysis } from "../scenarios/load-scenarios";
import { computeExecutiveInsights } from "./insights";
import {
  briefingKindLabel,
  emphasizedContributorHints,
  narrativeEmphasis,
  sectionOrderForKind,
} from "./kinds";
import { isWithinWindow, resolveBriefingWindow } from "./timeline";
import type {
  JagBriefingEvidenceRef,
  JagBriefingExplainability,
  JagBriefingKind,
  JagBriefingRecommendation,
  JagBriefingScope,
  JagBriefingSection,
  JagBriefingSectionAction,
  JagBriefingSectionId,
  JagBriefingTimeline,
  JagBriefingWindow,
  JagExecutiveBriefing,
} from "./types";

const OPERATIONAL_READINESS_ID = "education.cognition.operational_readiness";
const FUNDING_READINESS_ID = "education.cognition.funding_readiness";
const STUDENT_SUCCESS_ID = "education.cognition.student_success";
const COMPLIANCE_ID = "education.cognition.compliance";

const SECTION_TITLES: Record<JagBriefingSectionId, string> = {
  executive_summary: "Executive Summary",
  what_happened: "What happened?",
  why_it_happened: "Why did it happen?",
  decide_today: "What should I decide today?",
  if_i_do_nothing: "What happens if I do nothing?",
  watch_next: "What should I watch next?",
  todays_priorities: "Today's Priorities",
  critical_risks: "Critical Risks",
  opportunities: "Opportunities",
  decision_queue_summary: "Decision Queue Summary",
  completed_outcomes: "Completed Outcomes",
  emerging_trends: "Emerging Trends",
  forecast: "Forecast",
  scenario_analysis: "Scenario Analysis",
  historical_context: "Historical Context",
  strategic_alignment: "Strategic Alignment",
  recommended_executive_actions: "Recommended Executive Actions",
  executive_insights: "Executive Insights",
  appendix: "Appendix",
};

const FULL_ACTIONS: readonly JagBriefingSectionAction[] = [
  "approve_decision",
  "open_decision",
  "assign",
  "create_follow_up",
  "add_executive_note",
  "schedule_review",
];

const NOTE_ACTIONS: readonly JagBriefingSectionAction[] = [
  "add_executive_note",
  "create_follow_up",
  "schedule_review",
];

export function synthesizeExecutiveBriefing(input: {
  session: JagPlatformSession;
  scope?: JagBriefingScope;
  organizationId?: string;
  organizationIds?: readonly string[];
  kind?: JagBriefingKind;
  timeline: JagBriefingTimeline;
  customStart?: string;
  customEnd?: string;
  generatedBy: string;
  now?: Date;
}): JagExecutiveBriefing | { error: string } {
  const scope = input.scope ?? "single";
  const kind = input.kind ?? "weekly_executive_review";
  const sessionOrgs = listOrganizationsForSession(input.session);

  const resolved = resolveOrganizations({
    scope,
    sessionOrgs,
    organizationId: input.organizationId,
    organizationIds: input.organizationIds,
  });
  if ("error" in resolved) return resolved;
  const { organizationIds, organizationNames, primaryId, primaryName } =
    resolved;

  const windowResult = resolveBriefingWindow({
    timeline: input.timeline,
    now: input.now,
    customStart: input.customStart,
    customEnd: input.customEnd,
  });
  if ("error" in windowResult) return windowResult;
  const window = windowResult;

  const health = pickPrimaryHealth(organizationIds);
  const boundBrief = pickPrimaryBrief(organizationIds);
  const allExecutions = organizationIds.flatMap((id) =>
    listStoredExecutions(id, 100)
  );
  const executions = allExecutions.filter((e) =>
    isWithinWindow(e.analyzedAt, window)
  );

  const decisions = loadDecisionCenter(input.session, {}).decisions.filter(
    (d) => organizationIds.includes(d.organizationId)
  );
  const openDecisions = decisions.filter(
    (d) =>
      d.status !== "Completed" &&
      d.status !== "Outcome Reviewed" &&
      d.status !== "Dismissed"
  );
  const completedInWindow = decisions.filter((d) => {
    if (d.status !== "Completed" && d.status !== "Outcome Reviewed")
      return false;
    const at = getDecisionCompletedAt(d.id);
    return isWithinWindow(at ?? undefined, window);
  });

  const ops = pickContributor(allExecutions, OPERATIONAL_READINESS_ID, window);
  const funding = pickContributor(allExecutions, FUNDING_READINESS_ID, window);
  const student = pickContributor(allExecutions, STUDENT_SUCCESS_ID, window);
  const compliance = pickContributor(allExecutions, COMPLIANCE_ID, window);

  const recommendations = buildRecommendations({
    openDecisions,
    executions,
    kind,
  });

  const byId = new Map<JagBriefingSectionId, JagBriefingSection>();

  byId.set(
    "executive_summary",
    sectionExecutiveSummary({
      orgName: scopeLabel(scope, primaryName, organizationNames),
      emphasis: narrativeEmphasis(kind),
      window,
      health,
      boundBrief,
      openCount: openDecisions.length,
      completedCount: completedInWindow.length,
      executions,
      ops,
      funding,
      student,
    })
  );
  byId.set(
    "what_happened",
    sectionWhatHappened({ health, boundBrief, executions, completedInWindow })
  );
  byId.set(
    "why_it_happened",
    sectionWhyItHappened({ health, executions, ops, funding, student })
  );
  byId.set(
    "decide_today",
    sectionDecideToday(openDecisions, recommendations)
  );
  byId.set(
    "if_i_do_nothing",
    sectionIfDoNothing({ openDecisions, health, boundBrief })
  );
  byId.set(
    "watch_next",
    sectionWatchNext({ openDecisions, executions, health })
  );
  byId.set("todays_priorities", sectionTodaysPriorities(openDecisions));
  byId.set(
    "critical_risks",
    sectionCriticalRisks({
      health,
      boundBrief,
      executions,
      openDecisions,
      compliance,
    })
  );
  byId.set(
    "opportunities",
    sectionOpportunities({ boundBrief, executions, student, funding })
  );
  byId.set(
    "decision_queue_summary",
    sectionDecisionQueue(openDecisions, decisions)
  );
  byId.set(
    "completed_outcomes",
    sectionCompletedOutcomes(completedInWindow)
  );
  byId.set(
    "emerging_trends",
    sectionEmergingTrends({ executions, health, ops, funding, student })
  );
  byId.set(
    "forecast",
    sectionForecast({
      organizationId: primaryId,
      organizationName: primaryName,
      openDecisions,
      recommendations,
    })
  );
  byId.set(
    "scenario_analysis",
    sectionScenarioAnalysis({
      organizationId: primaryId,
      organizationName: primaryName,
    })
  );
  byId.set(
    "historical_context",
    sectionHistoricalContext({
      organizationId: primaryId,
      organizationName: primaryName,
    })
  );
  byId.set(
    "strategic_alignment",
    sectionStrategicAlignment({
      organizationId: primaryId,
      organizationName: primaryName,
    })
  );
  byId.set(
    "recommended_executive_actions",
    sectionRecommendedActions(recommendations, boundBrief)
  );

  const insights = computeExecutiveInsights({
    health,
    executions,
    openDecisions,
    completedDecisions: completedInWindow,
  });
  byId.set("executive_insights", sectionInsights(insights));
  byId.set(
    "appendix",
    sectionAppendix({
      window,
      scope,
      organizationNames,
      kind,
      health,
      boundBrief,
      executions,
      ops,
      funding,
      student,
      compliance,
      decisionCount: decisions.length,
    })
  );

  const sections = sectionOrderForKind(kind)
    .map((id) => byId.get(id))
    .filter((s): s is JagBriefingSection => Boolean(s));

  const confidences = sections
    .map((s) => s.confidence)
    .filter((c): c is number => typeof c === "number");
  const overallConfidence =
    confidences.length === 0
      ? null
      : confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const hasSubstance = sections.some(
    (s) => (s.bullets.length > 0 || s.recommendations.length > 0) && !s.emptyReason
  );

  const generatedAt = (input.now ?? new Date()).toISOString();
  const kindLabel = briefingKindLabel(kind);
  const id = createHash("sha256")
    .update(
      `${scope}|${organizationIds.join(",")}|${kind}|${window.timeline}|${window.start}|${window.end}|${generatedAt}`
    )
    .digest("hex")
    .slice(0, 24);

  return {
    id,
    organizationId: primaryId,
    organizationName: primaryName,
    organizationIds,
    organizationNames,
    scope,
    kind,
    kindLabel,
    generatedAt,
    generatedBy: input.generatedBy,
    window,
    title: `${kindLabel} · ${scopeLabel(scope, primaryName, organizationNames)} · ${window.label}`,
    overallConfidence,
    sourceCount: countSources({
      health: Boolean(health),
      boundBrief: Boolean(boundBrief),
      executions: executions.length,
      ops: Boolean(ops),
      funding: Boolean(funding),
      student: Boolean(student),
      decisions: decisions.length,
    }),
    sections,
    insights,
    recommendations,
    notes: [],
    scheduledReview: null,
    shareToken: null,
    hasSubstance,
  };
}

function resolveOrganizations(input: {
  scope: JagBriefingScope;
  sessionOrgs: readonly { id: string; name: string }[];
  organizationId?: string;
  organizationIds?: readonly string[];
}):
  | {
      organizationIds: string[];
      organizationNames: string[];
      primaryId: string;
      primaryName: string;
    }
  | { error: string } {
  if (input.sessionOrgs.length === 0) {
    return { error: "No organization is available for this session." };
  }

  if (input.scope === "enterprise") {
    const organizationIds = input.sessionOrgs.map((o) => o.id);
    const organizationNames = input.sessionOrgs.map((o) => o.name);
    return {
      organizationIds,
      organizationNames,
      primaryId: organizationIds[0]!,
      primaryName: organizationNames[0]!,
    };
  }

  if (input.scope === "multi") {
    const ids = (input.organizationIds?.length
      ? input.organizationIds
      : input.organizationId
        ? [input.organizationId]
        : []
    ).filter((id) => input.sessionOrgs.some((o) => o.id === id));
    if (ids.length === 0) {
      return {
        error: "Select one or more organizations for a multi-organization briefing.",
      };
    }
    const selected = input.sessionOrgs.filter((o) => ids.includes(o.id));
    return {
      organizationIds: selected.map((o) => o.id),
      organizationNames: selected.map((o) => o.name),
      primaryId: selected[0]!.id,
      primaryName: selected[0]!.name,
    };
  }

  const org =
    input.sessionOrgs.find((o) => o.id === input.organizationId) ??
    input.sessionOrgs[0]!;
  if (input.organizationId && !input.sessionOrgs.some((o) => o.id === input.organizationId)) {
    return { error: "Organization not found for this session." };
  }
  return {
    organizationIds: [org.id],
    organizationNames: [org.name],
    primaryId: org.id,
    primaryName: org.name,
  };
}

function scopeLabel(
  scope: JagBriefingScope,
  primaryName: string,
  names: readonly string[]
): string {
  if (scope === "enterprise") return "Entire Enterprise";
  if (scope === "multi") {
    return names.length <= 2
      ? names.join(" · ")
      : `${names[0]} + ${names.length - 1} orgs`;
  }
  return primaryName;
}

function pickPrimaryHealth(
  organizationIds: readonly string[]
): JagStoredSchoolHealth | null {
  for (const id of organizationIds) {
    const h = getStoredSchoolHealth(id);
    if (h) return h;
  }
  return null;
}

function pickPrimaryBrief(
  organizationIds: readonly string[]
): JagStoredExecutiveBrief | null {
  for (const id of organizationIds) {
    const b = getStoredExecutiveBrief(id);
    if (b) return b;
  }
  return null;
}

function pickContributor(
  executions: readonly JagStoredExecution[],
  contributorId: string,
  window: JagBriefingWindow
): JagStoredExecution | null {
  const inWindow = executions.filter(
    (e) =>
      e.contributorId === contributorId && isWithinWindow(e.analyzedAt, window)
  );
  if (inWindow[0]) return inWindow[0];
  return executions.find((e) => e.contributorId === contributorId) ?? null;
}

function section(
  id: JagBriefingSectionId,
  partial: Omit<JagBriefingSection, "id" | "title">
): JagBriefingSection {
  return { id, title: SECTION_TITLES[id], ...partial };
}

function emptySection(
  id: JagBriefingSectionId,
  emptyReason: string,
  contributors: readonly string[] = []
): JagBriefingSection {
  return section(id, {
    narrative: emptyReason,
    bullets: [],
    confidence: null,
    evidenceReferences: [],
    contributorSources: [...contributors],
    policyReferences: [],
    recommendations: [],
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
    emptyReason,
  });
}

function decisionHref(id: string): string {
  return `/jag/decisions/${id}`;
}

function explainFromDecision(d: JagDecisionCard): JagBriefingExplainability {
  const timeline = getDecisionTimeline(d.id).map((t) => ({
    at: t.at,
    message: t.message,
  }));
  const execution = listStoredExecutions(d.organizationId, 50).find(
    (e) => e.id === d.executionId
  );
  return {
    evidence: (execution?.detail?.evidence ?? []).slice(0, 6).map((e) => ({
      id: e.id,
      source: e.source || d.contributorId,
      code:
        typeof e.attributes?.code === "string" ? e.attributes.code : undefined,
      summary:
        typeof e.attributes?.summary === "string"
          ? e.attributes.summary
          : d.recommendedAction,
    })),
    contributors: [d.contributorId],
    policies: (execution?.detail?.recommendations ?? []).flatMap(
      (r) => r.constitutionalTrace?.laws ?? []
    ),
    confidence: d.confidence,
    dependencies: execution?.detail?.dependsOn ?? [],
    timeline,
  };
}

function recommendationFromDecision(
  d: JagDecisionCard
): JagBriefingRecommendation {
  return {
    id: `rec:${d.id}`,
    title: d.title,
    rationale: d.recommendedAction,
    decisionId: d.id,
    decisionHref: decisionHref(d.id),
    organizationId: d.organizationId,
    explainability: explainFromDecision(d),
  };
}

function buildRecommendations(input: {
  openDecisions: readonly JagDecisionCard[];
  executions: readonly JagStoredExecution[];
  kind: JagBriefingKind;
}): JagBriefingRecommendation[] {
  const hints = emphasizedContributorHints(input.kind);
  const scored = [...input.openDecisions].sort((a, b) => {
    const ah = hints.some((h) => a.contributorId.includes(h)) ? 0 : 1;
    const bh = hints.some((h) => b.contributorId.includes(h)) ? 0 : 1;
    if (ah !== bh) return ah - bh;
    return a.priorityRank - b.priorityRank;
  });

  const fromDecisions = scored.slice(0, 8).map(recommendationFromDecision);
  if (fromDecisions.length > 0) return fromDecisions;

  // Fallback: proposal-only recommendations still link when a decision exists
  const fromExec: JagBriefingRecommendation[] = [];
  for (const e of input.executions) {
    for (const action of e.suggestedActions.slice(0, 2)) {
      fromExec.push({
        id: `action:${e.id}:${action.actionId}`,
        title: action.label,
        rationale: action.rationale,
        decisionId: null,
        decisionHref: null,
        organizationId: e.organizationId,
        explainability: {
          evidence: evidenceFromExecution(e).slice(0, 4),
          contributors: [e.contributorId],
          policies: policiesFromExecution(e),
          confidence: e.confidence,
          dependencies: e.detail?.dependsOn ?? [],
          timeline: [{ at: e.analyzedAt, message: e.resultSummary }],
        },
      });
    }
  }
  return fromExec.slice(0, 8);
}

function sectionExecutiveSummary(input: {
  orgName: string;
  emphasis: string;
  window: JagBriefingWindow;
  health: JagStoredSchoolHealth | null;
  boundBrief: JagStoredExecutiveBrief | null;
  openCount: number;
  completedCount: number;
  executions: readonly JagStoredExecution[];
  ops: JagStoredExecution | null;
  funding: JagStoredExecution | null;
  student: JagStoredExecution | null;
}): JagBriefingSection {
  const parts: string[] = [input.emphasis];
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const policies: string[] = [];
  const confidences: number[] = [];

  if (input.boundBrief) {
    parts.push(input.boundBrief.summary);
    bullets.push(`Bound brief stance: ${input.boundBrief.stance}`);
    confidences.push(input.boundBrief.confidence);
    contributors.add("education.cognition.executive_briefing");
  }
  if (input.health) {
    parts.push(
      `Organization health is ${input.health.stance} (score ${input.health.healthScore.toFixed(2)}, risk ${input.health.riskLevel}).`
    );
    bullets.push(...input.health.primaryDrivers.slice(0, 3));
    confidences.push(input.health.confidence);
    contributors.add("education.cognition.school_health");
    evidence.push({
      id: `health:${input.health.capturedAt}`,
      source: "education.cognition.school_health",
      summary: input.health.explanation,
      code: "school_health",
    });
  }
  bullets.push(
    `Decision queue: ${input.openCount} open · ${input.completedCount} completed in window`
  );
  bullets.push(`Contributor executions in window: ${input.executions.length}`);

  for (const exec of [input.ops, input.funding, input.student]) {
    if (!exec) continue;
    contributors.add(exec.contributorId);
    confidences.push(exec.confidence);
    bullets.push(`${exec.label}: ${exec.resultSummary}`);
    evidence.push(...evidenceFromExecution(exec).slice(0, 2));
    policies.push(...policiesFromExecution(exec));
  }

  if (!input.health && !input.boundBrief && input.executions.length === 0) {
    return emptySection(
      "executive_summary",
      `No bound Organization Health or Executive Briefing for ${input.orgName} in this window. Bind an Education Intelligence snapshot to synthesize a summary.`,
      [
        "education.cognition.school_health",
        "education.cognition.executive_briefing",
      ]
    );
  }

  return section("executive_summary", {
    narrative: parts.join(" "),
    bullets,
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
    recommendations: [],
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
  });
}

function sectionWhatHappened(input: {
  health: JagStoredSchoolHealth | null;
  boundBrief: JagStoredExecutiveBrief | null;
  executions: readonly JagStoredExecution[];
  completedInWindow: readonly JagDecisionCard[];
}): JagBriefingSection {
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const confidences: number[] = [];

  if (input.boundBrief) {
    bullets.push(input.boundBrief.summary);
    contributors.add("education.cognition.executive_briefing");
    confidences.push(input.boundBrief.confidence);
  }
  if (input.health) {
    bullets.push(
      `Health stance ${input.health.stance}${input.health.trend ? ` · trend ${input.health.trend}` : ""}`
    );
    contributors.add("education.cognition.school_health");
    confidences.push(input.health.confidence);
    evidence.push({
      id: `happened-health:${input.health.capturedAt}`,
      source: "education.cognition.school_health",
      summary: input.health.explanation,
    });
  }
  for (const e of input.executions.slice(0, 6)) {
    bullets.push(`${e.label}: ${e.resultSummary}`);
    contributors.add(e.contributorId);
    confidences.push(e.confidence);
    evidence.push(...evidenceFromExecution(e).slice(0, 1));
  }
  for (const d of input.completedInWindow.slice(0, 4)) {
    bullets.push(`Completed decision: ${d.title}`);
    contributors.add(d.contributorId);
  }

  if (bullets.length === 0) {
    return emptySection(
      "what_happened",
      "No bound events in this window to describe what happened."
    );
  }
  return section("what_happened", {
    narrative: "What changed in the selected window, from bound intelligence only.",
    bullets,
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: [],
    recommendations: [],
    decisionIds: input.completedInWindow.map((d) => d.id),
    availableActions: FULL_ACTIONS,
  });
}

function sectionWhyItHappened(input: {
  health: JagStoredSchoolHealth | null;
  executions: readonly JagStoredExecution[];
  ops: JagStoredExecution | null;
  funding: JagStoredExecution | null;
  student: JagStoredExecution | null;
}): JagBriefingSection {
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const policies: string[] = [];
  const confidences: number[] = [];

  if (input.health?.primaryDrivers.length) {
    bullets.push(...input.health.primaryDrivers.map((d) => `Driver: ${d}`));
    contributors.add("education.cognition.school_health");
    confidences.push(input.health.confidence);
  }
  for (const exec of [input.ops, input.funding, input.student, ...input.executions]) {
    if (!exec) continue;
    for (const w of exec.detail?.warnings ?? []) {
      bullets.push(`Warning (${exec.label}): ${w}`);
      contributors.add(exec.contributorId);
      confidences.push(exec.confidence);
    }
    for (const b of exec.detail?.blockingIssues ?? []) {
      bullets.push(`Blocking (${exec.label}): ${b}`);
      contributors.add(exec.contributorId);
    }
    evidence.push(...evidenceFromExecution(exec).slice(0, 1));
    policies.push(...policiesFromExecution(exec));
  }

  if (bullets.length === 0) {
    return emptySection(
      "why_it_happened",
      "No drivers, warnings, or blocking issues are bound to explain why."
    );
  }
  return section("why_it_happened", {
    narrative: "Causal signals from health drivers, warnings, and blocking issues.",
    bullets: bullets.slice(0, 12),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
    recommendations: [],
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
  });
}

function sectionDecideToday(
  openDecisions: readonly JagDecisionCard[],
  recommendations: readonly JagBriefingRecommendation[]
): JagBriefingSection {
  const today = openDecisions
    .filter((d) => d.priority === "P1" || d.status === "Approved" || d.isOverdue)
    .slice(0, 5);
  const recs =
    recommendations.filter((r) =>
      today.some((d) => d.id === r.decisionId)
    ).length > 0
      ? recommendations.filter((r) => today.some((d) => d.id === r.decisionId))
      : recommendations.slice(0, 5);

  if (today.length === 0 && recs.length === 0) {
    return emptySection(
      "decide_today",
      "No P1, overdue, or approved decisions require action today."
    );
  }

  return section("decide_today", {
    narrative:
      "Decisions that require executive attention today — each links to the Decision Center.",
    bullets: (today.length ? today : openDecisions.slice(0, 5)).map(
      (d) => `${d.priority} · ${d.title} (${d.status})`
    ),
    confidence: avg(today.map((d) => d.confidence)),
    evidenceReferences: today.map((d) => ({
      id: d.id,
      source: "decision-center",
      summary: d.title,
      code: d.status,
    })),
    contributorSources: uniqueStrings(today.map((d) => d.contributorId)),
    policyReferences: [],
    recommendations: recs,
    decisionIds: today.map((d) => d.id),
    availableActions: FULL_ACTIONS,
  });
}

function sectionIfDoNothing(input: {
  openDecisions: readonly JagDecisionCard[];
  health: JagStoredSchoolHealth | null;
  boundBrief: JagStoredExecutiveBrief | null;
}): JagBriefingSection {
  const bullets: string[] = [];
  const confidences: number[] = [];
  const contributors = new Set<string>();
  const overdue = input.openDecisions.filter((d) => d.isOverdue);
  const p1 = input.openDecisions.filter((d) => d.priority === "P1");

  if (overdue.length) {
    bullets.push(
      `${overdue.length} overdue decision(s) remain open — delay increases operational exposure.`
    );
  }
  if (p1.length) {
    bullets.push(
      `${p1.length} P1 decision(s) unanswered — inaction leaves critical recommendations idle.`
    );
  }
  if (input.health && (input.health.riskLevel === "high" || input.health.stance === "at_risk")) {
    bullets.push(
      `Health risk remains ${input.health.riskLevel}; without action, drivers persist: ${input.health.primaryDrivers.slice(0, 2).join("; ") || input.health.explanation}`
    );
    contributors.add("education.cognition.school_health");
    confidences.push(input.health.confidence);
  }
  if (input.boundBrief?.criticalRisks.length) {
    bullets.push(
      `Bound briefing risks remain unmitigated: ${input.boundBrief.criticalRisks.slice(0, 2).join("; ")}`
    );
    contributors.add("education.cognition.executive_briefing");
    confidences.push(input.boundBrief.confidence);
  }

  if (bullets.length === 0) {
    return emptySection(
      "if_i_do_nothing",
      "No elevated inaction risk signals from overdue/P1 decisions or high health risk."
    );
  }

  return section("if_i_do_nothing", {
    narrative: "Cost of inaction derived from open risks and overdue decisions.",
    bullets,
    confidence: avg(confidences),
    evidenceReferences: [...overdue, ...p1].slice(0, 5).map((d) => ({
      id: d.id,
      source: "decision-center",
      summary: d.title,
    })),
    contributorSources: [...contributors],
    policyReferences: [],
    recommendations: [...overdue, ...p1]
      .slice(0, 5)
      .map(recommendationFromDecision),
    decisionIds: [...overdue, ...p1].map((d) => d.id),
    availableActions: FULL_ACTIONS,
  });
}

function sectionWatchNext(input: {
  openDecisions: readonly JagDecisionCard[];
  executions: readonly JagStoredExecution[];
  health: JagStoredSchoolHealth | null;
}): JagBriefingSection {
  const bullets: string[] = [];
  const contributors = new Set<string>();
  const confidences: number[] = [];

  if (input.health?.trend) {
    bullets.push(`Watch health trend: ${input.health.trend}`);
    contributors.add("education.cognition.school_health");
    confidences.push(input.health.confidence);
  }
  for (const e of input.executions.filter(
    (x) => x.detail?.readiness === "conditional" || x.confidence < 0.6
  ).slice(0, 4)) {
    bullets.push(`Watch ${e.label} (conf ${e.confidence.toFixed(2)})`);
    contributors.add(e.contributorId);
    confidences.push(e.confidence);
  }
  for (const d of input.openDecisions
    .filter((x) => x.status === "Assigned" || x.status === "In Progress")
    .slice(0, 4)) {
    bullets.push(`Track decision: ${d.title} (${d.status})`);
    contributors.add(d.contributorId);
  }

  if (bullets.length === 0) {
    return emptySection(
      "watch_next",
      "No watch items from trends, low-confidence runs, or in-flight decisions."
    );
  }
  return section("watch_next", {
    narrative: "Forward watch list from trends, conditional readiness, and in-flight work.",
    bullets,
    confidence: avg(confidences),
    evidenceReferences: [],
    contributorSources: [...contributors],
    policyReferences: [],
    recommendations: input.openDecisions
      .filter((x) => x.status === "Assigned" || x.status === "In Progress")
      .slice(0, 4)
      .map(recommendationFromDecision),
    decisionIds: input.openDecisions
      .filter((x) => x.status === "Assigned" || x.status === "In Progress")
      .map((d) => d.id),
    availableActions: FULL_ACTIONS,
  });
}

function sectionTodaysPriorities(
  openDecisions: readonly JagDecisionCard[]
): JagBriefingSection {
  const top = [...openDecisions]
    .sort((a, b) => a.priorityRank - b.priorityRank)
    .slice(0, 5);
  if (top.length === 0) {
    return emptySection(
      "todays_priorities",
      "No open Decision Center items for this organization scope."
    );
  }
  return section("todays_priorities", {
    narrative: `Top ${top.length} open executive priorities from the Decision Center queue.`,
    bullets: top.map(
      (d) =>
        `${d.priority} · ${d.title} (${d.status}) — ${d.recommendedAction}`
    ),
    confidence: avg(top.map((d) => d.confidence)),
    evidenceReferences: top.map((d) => ({
      id: d.id,
      source: "decision-center",
      summary: d.title,
      code: d.status,
    })),
    contributorSources: uniqueStrings(top.map((d) => d.contributorId)),
    policyReferences: [],
    recommendations: top.map(recommendationFromDecision),
    decisionIds: top.map((d) => d.id),
    availableActions: FULL_ACTIONS,
  });
}

function sectionCriticalRisks(input: {
  health: JagStoredSchoolHealth | null;
  boundBrief: JagStoredExecutiveBrief | null;
  executions: readonly JagStoredExecution[];
  openDecisions: readonly JagDecisionCard[];
  compliance: JagStoredExecution | null;
}): JagBriefingSection {
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const policies: string[] = [];
  const confidences: number[] = [];
  const decisionIds: string[] = [];

  if (input.boundBrief?.criticalRisks.length) {
    for (const r of input.boundBrief.criticalRisks) bullets.push(r);
    contributors.add("education.cognition.executive_briefing");
    confidences.push(input.boundBrief.confidence);
  }
  if (
    input.health &&
    (input.health.riskLevel === "high" ||
      input.health.stance === "at_risk" ||
      input.health.stance === "critical")
  ) {
    bullets.push(
      `School Health risk level ${input.health.riskLevel} · stance ${input.health.stance}`
    );
    contributors.add("education.cognition.school_health");
    confidences.push(input.health.confidence);
  }
  if (input.compliance) {
    bullets.push(`Compliance: ${input.compliance.resultSummary}`);
    contributors.add(input.compliance.contributorId);
    confidences.push(input.compliance.confidence);
    policies.push(...policiesFromExecution(input.compliance));
  }
  for (const d of input.openDecisions.filter(
    (x) => x.isOverdue || x.priority === "P1"
  )) {
    bullets.push(`${d.isOverdue ? "Overdue" : "P1"} decision: ${d.title}`);
    contributors.add(d.contributorId);
    confidences.push(d.confidence);
    decisionIds.push(d.id);
    evidence.push({
      id: d.id,
      source: "decision-center",
      summary: d.title,
      code: d.priority,
    });
  }
  for (const e of input.executions) {
    for (const issue of e.detail?.blockingIssues ?? []) {
      bullets.push(`${e.label}: ${issue}`);
      contributors.add(e.contributorId);
    }
  }

  if (bullets.length === 0) {
    return emptySection(
      "critical_risks",
      "No critical risks bound from School Health, briefing, compliance, or P1/overdue decisions."
    );
  }
  return section("critical_risks", {
    narrative:
      "Critical risks synthesized from health posture, briefing signals, and the decision queue.",
    bullets: bullets.slice(0, 10),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
    recommendations: input.openDecisions
      .filter((x) => x.isOverdue || x.priority === "P1")
      .slice(0, 5)
      .map(recommendationFromDecision),
    decisionIds,
    availableActions: FULL_ACTIONS,
  });
}

function sectionOpportunities(input: {
  boundBrief: JagStoredExecutiveBrief | null;
  executions: readonly JagStoredExecution[];
  student: JagStoredExecution | null;
  funding: JagStoredExecution | null;
}): JagBriefingSection {
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const policies: string[] = [];
  const confidences: number[] = [];

  if (input.boundBrief?.strategicPriorities.length) {
    for (const p of input.boundBrief.strategicPriorities) {
      bullets.push(`Strategic priority: ${p}`);
    }
    contributors.add("education.cognition.executive_briefing");
    confidences.push(input.boundBrief.confidence);
  }
  for (const exec of [input.student, input.funding]) {
    if (!exec) continue;
    if (exec.detail?.readiness === "ready" || exec.confidence >= 0.7) {
      bullets.push(`Opportunity via ${exec.label}: ${exec.resultSummary}`);
      contributors.add(exec.contributorId);
      confidences.push(exec.confidence);
      evidence.push(...evidenceFromExecution(exec).slice(0, 2));
      policies.push(...policiesFromExecution(exec));
    }
  }

  if (bullets.length === 0) {
    return emptySection(
      "opportunities",
      "No opportunity signals from strategic priorities, student success, or funding readiness."
    );
  }
  return section("opportunities", {
    narrative:
      "Opportunities drawn from strategic priorities and positive readiness signals.",
    bullets: bullets.slice(0, 10),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
    recommendations: [],
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
  });
}

function sectionDecisionQueue(
  openDecisions: readonly JagDecisionCard[],
  allDecisions: readonly JagDecisionCard[]
): JagBriefingSection {
  if (allDecisions.length === 0) {
    return emptySection(
      "decision_queue_summary",
      "No Decision Center proposals are projected for this organization scope."
    );
  }
  const byStatus = new Map<string, number>();
  for (const d of allDecisions) {
    byStatus.set(d.status, (byStatus.get(d.status) ?? 0) + 1);
  }
  return section("decision_queue_summary", {
    narrative: `Decision Center holds ${allDecisions.length} projected decisions (${openDecisions.length} open).`,
    bullets: [
      ...[...byStatus.entries()].map(([s, n]) => `${s}: ${n}`),
      ...openDecisions
        .slice(0, 5)
        .map(
          (d) =>
            `${d.priority} · ${d.title} · ${d.status}${
              d.assignment ? ` · ${d.assignment.summary}` : ""
            }`
        ),
    ],
    confidence: avg(openDecisions.map((d) => d.confidence)),
    evidenceReferences: openDecisions.slice(0, 5).map((d) => ({
      id: d.id,
      source: "decision-center",
      summary: d.title,
      code: d.status,
    })),
    contributorSources: uniqueStrings(
      openDecisions.map((d) => d.contributorId)
    ),
    policyReferences: [],
    recommendations: openDecisions.slice(0, 5).map(recommendationFromDecision),
    decisionIds: openDecisions.map((d) => d.id),
    availableActions: FULL_ACTIONS,
  });
}

function sectionCompletedOutcomes(
  completed: readonly JagDecisionCard[]
): JagBriefingSection {
  if (completed.length === 0) {
    return emptySection(
      "completed_outcomes",
      "No decisions reached Completed or Outcome Reviewed in this timeline window."
    );
  }
  const bullets: string[] = [];
  for (const d of completed) {
    const outcome = getDecisionOutcome(d.id);
    const feedback = getDecisionFeedback(d.id);
    if (outcome) {
      bullets.push(
        `${d.title}: ${outcome.result} — expected “${outcome.expectedOutcome}”; actual “${outcome.actualOutcome}”`
      );
    } else {
      bullets.push(`${d.title}: completed (outcome not yet reviewed)`);
    }
    if (feedback) {
      bullets.push(
        `Feedback: achieved=${feedback.achievedIntendedResult ? "yes" : "no"}; future ${feedback.futurePriority}`
      );
    }
  }
  return section("completed_outcomes", {
    narrative: `${completed.length} decision outcome(s) closed in the selected window.`,
    bullets: bullets.slice(0, 12),
    confidence: avg(completed.map((d) => d.confidence)),
    evidenceReferences: completed.map((d) => ({
      id: d.id,
      source: "decision-center.outcome",
      summary: d.title,
    })),
    contributorSources: uniqueStrings(completed.map((d) => d.contributorId)),
    policyReferences: [],
    recommendations: completed.map(recommendationFromDecision),
    decisionIds: completed.map((d) => d.id),
    availableActions: ["open_decision", "add_executive_note", "create_follow_up"],
  });
}

function sectionEmergingTrends(input: {
  executions: readonly JagStoredExecution[];
  health: JagStoredSchoolHealth | null;
  ops: JagStoredExecution | null;
  funding: JagStoredExecution | null;
  student: JagStoredExecution | null;
}): JagBriefingSection {
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const policies: string[] = [];
  const confidences: number[] = [];

  if (input.health?.trend) {
    bullets.push(`Health trend: ${input.health.trend}`);
    contributors.add("education.cognition.school_health");
    confidences.push(input.health.confidence);
  }
  for (const exec of [
    input.ops,
    input.funding,
    input.student,
    ...input.executions,
  ]) {
    if (!exec) continue;
    contributors.add(exec.contributorId);
    confidences.push(exec.confidence);
    bullets.push(
      `${exec.label} readiness ${exec.detail?.readiness ?? "unknown"} · conf ${exec.confidence.toFixed(2)}`
    );
    evidence.push(...evidenceFromExecution(exec).slice(0, 1));
    policies.push(...policiesFromExecution(exec));
  }
  if (bullets.length === 0) {
    return emptySection(
      "emerging_trends",
      "No emerging trend signals from contributor executions in this window."
    );
  }
  return section("emerging_trends", {
    narrative: "Emerging trends from recent contributor readiness and warnings.",
    bullets: uniqueStrings(bullets).slice(0, 12),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
    recommendations: [],
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
  });
}

function sectionForecast(input: {
  organizationId: string;
  organizationName: string;
  openDecisions: readonly JagDecisionCard[];
  recommendations: readonly JagBriefingRecommendation[];
}): JagBriefingSection {
  const { predictions } = runForecastsForBriefing({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    decisions: input.openDecisions,
    horizon: "30_days",
  });

  const usable = predictions.filter((p) => !p.insufficientData);
  if (usable.length === 0) {
    return emptySection(
      "forecast",
      "Advisory forecast unavailable — bind contributor outputs to project what is likely to happen next.",
      ["jag.predictive_intelligence"]
    );
  }

  const bullets: string[] = [
    "Advisory only — these are not facts. Review confidence, drivers, and assumptions before acting.",
  ];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>(["jag.predictive_intelligence"]);
  const confidences: number[] = [];
  const preventative: JagBriefingRecommendation[] = [];

  for (const p of usable.slice(0, 4)) {
    confidences.push(p.confidence);
    bullets.push(
      `Likely next (${p.horizonLabel}): ${p.title} — ${p.predictedState.summary} (confidence ${(p.confidence * 100).toFixed(0)}%, trend ${p.trend}).`
    );
    bullets.push(
      `Why: ${p.primaryDrivers
        .slice(0, 2)
        .map((d) => d.label)
        .join("; ") || "see evidence"}.`
    );
    for (const e of p.evidence.slice(0, 2)) {
      evidence.push({
        id: e.id,
        source: e.source,
        summary: e.summary,
      });
      if (e.contributorId) contributors.add(e.contributorId);
    }
    for (const a of p.recommendedPreventiveActions.slice(0, 1)) {
      const related =
        input.openDecisions.find((d) =>
          a.relatedDecisionKinds?.some((k) =>
            d.actionKind.toLowerCase().includes(k)
          )
        ) ?? input.openDecisions[0];
      preventative.push({
        id: `forecast-action-${p.kind}-${a.id}`,
        title: a.title,
        rationale: `${a.rationale} (forecast: ${p.title})`,
        decisionId: related?.id ?? null,
        decisionHref: related ? decisionHref(related.id) : null,
        organizationId: input.organizationId,
        explainability: {
          evidence: p.evidence.slice(0, 4).map((e) => ({
            id: e.id,
            source: e.source,
            summary: e.summary,
          })),
          contributors: [...p.supportingContributors],
          policies: p.assumptions.map((x) => x.statement),
          confidence: p.confidence,
          dependencies: [],
          timeline: [],
        },
      });
    }
  }

  const whyLine = usable
    .flatMap((p) => p.primaryDrivers.slice(0, 1).map((d) => d.explanation))
    .slice(0, 2)
    .join(" ");

  return section("forecast", {
    narrative: [
      "What is likely to happen next (advisory):",
      usable.map((p) => p.narrative).join(" "),
      whyLine ? `Why: ${whyLine}` : "",
      `Confidence reflects evidence strength across ${usable.length} forecast(s), not certainty of outcome.`,
      "Recommended preventative decisions appear below.",
    ]
      .filter(Boolean)
      .join(" "),
    bullets: uniqueStrings(bullets).slice(0, 14),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: usable.flatMap((p) =>
      p.assumptions.slice(0, 2).map((a) => a.statement)
    ),
    recommendations: [
      ...preventative,
      ...input.recommendations.slice(0, 2),
    ].slice(0, 6),
    decisionIds: preventative
      .map((r) => r.decisionId)
      .filter((id): id is string => Boolean(id)),
    availableActions: FULL_ACTIONS,
  });
}

function sectionScenarioAnalysis(input: {
  organizationId: string;
  organizationName: string;
}): JagBriefingSection {
  const { results, comparison } = runBriefingScenarioAnalysis({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });

  if (!comparison || results.length === 0) {
    return emptySection(
      "scenario_analysis",
      "Scenario analysis unavailable — open Scenario Planner to model approve / defer / reject and custom inputs.",
      ["jag.scenario_planning"]
    );
  }

  const byId = new Map(comparison.rows.map((r) => [r.scenarioId, r]));
  const favorable = comparison.mostFavorableId
    ? byId.get(comparison.mostFavorableId)
    : null;
  const highestRisk = comparison.highestRiskId
    ? byId.get(comparison.highestRiskId)
    : null;
  const highestConfidence = comparison.highestConfidenceId
    ? byId.get(comparison.highestConfidenceId)
    : null;

  const bullets = [
    "Advisory scenario projections — not certainty. Separate observed facts, forecasts, and assumptions.",
    favorable
      ? `Most favorable option: ${favorable.title} (Δ ${(favorable.scoreDelta * 100).toFixed(1)} pts).`
      : "Most favorable option: unavailable.",
    highestRisk
      ? `Highest risk option: ${highestRisk.title} (${highestRisk.riskCount} risk signal(s)).`
      : "Highest risk option: unavailable.",
    highestConfidence
      ? `Highest confidence option: ${highestConfidence.title} (${(highestConfidence.confidence * 100).toFixed(0)}%).`
      : "Highest confidence option: unavailable.",
    ...results.slice(0, 3).map(
      (r) =>
        `${r.title}: ${r.projectedDifference.summary} · ${(r.confidence * 100).toFixed(0)}% confidence`
    ),
  ];

  return section("scenario_analysis", {
    narrative: comparison.narrative,
    bullets,
    confidence: avg(results.map((r) => r.confidence)),
    evidenceReferences: results.flatMap((r) =>
      r.evidence.slice(0, 2).map((e) => ({
        id: e.id,
        source: e.source,
        summary: e.summary,
      }))
    ),
    contributorSources: [
      "jag.scenario_planning",
      ...new Set(results.flatMap((r) => r.evidence.map((e) => e.contributorId).filter(Boolean) as string[])),
    ],
    policyReferences: results.flatMap((r) =>
      r.assumptions.slice(0, 1).map((a) => a.statement)
    ),
    recommendations: results.flatMap((r) =>
      r.recommendedDecisions.slice(0, 1).map((d) => ({
        id: `scn-rec-${r.id}-${d.id}`,
        title: d.title,
        rationale: d.rationale,
        decisionId: null,
        decisionHref: `/jag/scenarios?org=${encodeURIComponent(input.organizationId)}`,
        organizationId: input.organizationId,
        explainability: {
          evidence: r.evidence.slice(0, 3).map((e) => ({
            id: e.id,
            source: e.source,
            summary: e.summary,
          })),
          contributors: ["jag.scenario_planning"],
          policies: r.assumptions.map((a) => a.statement),
          confidence: r.confidence,
          dependencies: [],
          timeline: [],
        },
      }))
    ).slice(0, 4),
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
  });
}

function sectionHistoricalContext(input: {
  organizationId: string;
  organizationName: string;
}): JagBriefingSection {
  const ctx = runHistoricalContextForBriefing({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });

  if (
    ctx.situations.length === 0 &&
    ctx.lessons.length === 0 &&
    ctx.patternSummaries.length === 0
  ) {
    return emptySection(
      "historical_context",
      "No institutional memory yet for this organization. Decision outcomes and lessons learned will populate Historical Context.",
      ["jag.organizational_memory"]
    );
  }

  const bullets = [
    "Institutional memory — organizational experience, not chat history. Advisory when applying to current decisions.",
    ...ctx.situations.slice(0, 4).map(
      (s) =>
        `Similar: ${s.title} (${s.date}) · outcome ${s.outcome} · ${(s.confidence * 100).toFixed(0)}% confidence`
    ),
    ...ctx.lessons.slice(0, 3).map(
      (l) => `Lesson: ${l.title} — ${l.outcomeSummary ?? l.description}`
    ),
    ...ctx.patternSummaries,
  ];

  return section("historical_context", {
    narrative: [
      "Historical context from institutional memory:",
      ctx.situations.length
        ? `${ctx.situations.length} similar situation(s).`
        : "No close similarity matches.",
      ctx.lessons.length
        ? `${ctx.lessons.length} lesson(s) on record.`
        : "No structured lessons yet.",
    ].join(" "),
    bullets: uniqueStrings(bullets).slice(0, 14),
    confidence: avg([
      ...ctx.situations.map((s) => s.confidence),
      ...ctx.lessons.map((l) => l.confidence),
    ]),
    evidenceReferences: ctx.situations.slice(0, 4).map((s) => ({
      id: s.memoryId,
      source: "Organizational Memory",
      summary: s.outcomeSummary,
    })),
    contributorSources: ["jag.organizational_memory"],
    policyReferences: [],
    recommendations: ctx.situations.slice(0, 2).map((s) => ({
      id: `mem-rec-${s.memoryId}`,
      title: `Review prior situation: ${s.title}`,
      rationale: s.lessons[0] ?? s.outcomeSummary,
      decisionId: null,
      decisionHref: s.href,
      organizationId: input.organizationId,
      explainability: {
        evidence: [
          {
            id: s.memoryId,
            source: "Organizational Memory",
            summary: s.outcomeSummary,
          },
        ],
        contributors: ["jag.organizational_memory"],
        policies: [],
        confidence: s.confidence,
        dependencies: [],
        timeline: [{ at: s.date, message: s.title }],
      },
    })),
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
  });
}

function sectionStrategicAlignment(input: {
  organizationId: string;
  organizationName: string;
}): JagBriefingSection {
  const ctx = runStrategicAlignmentForBriefing({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });
  const sc = ctx.scorecard;

  const bullets = [
    `Mission alignment score ${(sc.alignmentScore * 100).toFixed(0)}% · forecast trend ${ctx.forecastTrend}.`,
    sc.goalsImproving.length
      ? `Goals improving: ${sc.goalsImproving.slice(0, 4).join("; ")}`
      : "No clearly improving goals yet.",
    sc.goalsDeclining.length
      ? `Goals declining: ${sc.goalsDeclining.slice(0, 4).join("; ")}`
      : "No declining goals flagged.",
    sc.goalsAtRisk.length
      ? `Goals at risk: ${sc.goalsAtRisk.slice(0, 4).join("; ")}`
      : "No goals currently at risk.",
    sc.initiativesBehind.length
      ? `Initiatives behind schedule: ${sc.initiativesBehind.slice(0, 4).join("; ")}`
      : "No initiatives behind schedule.",
    `Mission: ${sc.missionSummary}`,
    ...ctx.strategicRisks.slice(0, 3),
  ];

  return section("strategic_alignment", {
    narrative: [
      "Strategic alignment — whether today's work advances the mission.",
      `Alignment ${(sc.alignmentScore * 100).toFixed(0)}%.`,
      `Vision: ${sc.visionSummary}`,
    ].join(" "),
    bullets: uniqueStrings(bullets).slice(0, 14),
    confidence: Math.min(0.9, 0.45 + sc.alignmentScore * 0.4),
    evidenceReferences: [
      {
        id: `strategy-${input.organizationId}`,
        source: "Strategic Intelligence",
        summary: sc.missionSummary.slice(0, 160),
      },
    ],
    contributorSources: ["jag.strategic_intelligence"],
    policyReferences: [],
    recommendations: sc.goalsAtRisk.slice(0, 2).map((title, idx) => ({
      id: `strategy-rec-${idx}`,
      title: `Stabilize at-risk goal: ${title}`,
      rationale: "Goal health indicates strategic risk this period.",
      decisionId: null,
      decisionHref: `/jag/strategy?org=${encodeURIComponent(input.organizationId)}`,
      organizationId: input.organizationId,
      explainability: {
        evidence: [
          {
            id: `strategy-ev-${idx}`,
            source: "Strategic Intelligence",
            summary: title,
          },
        ],
        contributors: ["jag.strategic_intelligence"],
        policies: [],
        confidence: 0.7,
        dependencies: [],
        timeline: [],
      },
    })),
    decisionIds: [],
    availableActions: NOTE_ACTIONS,
  });
}

function sectionRecommendedActions(
  recommendations: readonly JagBriefingRecommendation[],
  boundBrief: JagStoredExecutiveBrief | null
): JagBriefingSection {
  const bullets = [
    ...(boundBrief?.recommendedActions ?? []),
    ...recommendations.map((r) => r.title),
  ];
  if (bullets.length === 0) {
    return emptySection(
      "recommended_executive_actions",
      "No recommended executive actions available from bound brief or decision proposals."
    );
  }
  return section("recommended_executive_actions", {
    narrative:
      "Recommended executive actions — each Decision Center link supports Review, Approve, Assign, and Track.",
    bullets: uniqueStrings(bullets).slice(0, 12),
    confidence: avg(
      recommendations
        .map((r) => r.explainability.confidence)
        .filter((c): c is number => typeof c === "number")
    ),
    evidenceReferences: recommendations.flatMap(
      (r) => r.explainability.evidence
    ).slice(0, 12),
    contributorSources: uniqueStrings(
      recommendations.flatMap((r) => r.explainability.contributors)
    ),
    policyReferences: uniqueStrings(
      recommendations.flatMap((r) => r.explainability.policies)
    ),
    recommendations,
    decisionIds: recommendations
      .map((r) => r.decisionId)
      .filter((id): id is string => Boolean(id)),
    availableActions: FULL_ACTIONS,
  });
}

function sectionInsights(
  insights: ReturnType<typeof computeExecutiveInsights>
): JagBriefingSection {
  if (insights.length === 0) {
    return emptySection(
      "executive_insights",
      "No executive insights could be computed — bind health, executions, or decisions first."
    );
  }
  return section("executive_insights", {
    narrative:
      "Automatically identified insights from existing intelligence. Nothing fabricated.",
    bullets: insights.map((i) => `${i.label}: ${i.value} — ${i.detail}`),
    confidence: avg(
      insights
        .map((i) => i.confidence)
        .filter((c): c is number => typeof c === "number")
    ),
    evidenceReferences: insights
      .filter((i) => i.decisionId)
      .map((i) => ({
        id: i.decisionId!,
        source: "decision-center",
        summary: i.value,
      })),
    contributorSources: [],
    policyReferences: [],
    recommendations: insights
      .filter((i) => i.decisionId)
      .map((i) => ({
        id: `insight:${i.kind}`,
        title: i.value,
        rationale: i.detail,
        decisionId: i.decisionId,
        decisionHref: i.decisionHref,
        explainability: {
          evidence: [],
          contributors: [],
          policies: [],
          confidence: i.confidence,
          dependencies: [],
          timeline: [],
        },
      })),
    decisionIds: insights
      .map((i) => i.decisionId)
      .filter((id): id is string => Boolean(id)),
    availableActions: FULL_ACTIONS,
  });
}

function sectionAppendix(input: {
  window: JagBriefingWindow;
  scope: JagBriefingScope;
  organizationNames: readonly string[];
  kind: JagBriefingKind;
  health: JagStoredSchoolHealth | null;
  boundBrief: JagStoredExecutiveBrief | null;
  executions: readonly JagStoredExecution[];
  ops: JagStoredExecution | null;
  funding: JagStoredExecution | null;
  student: JagStoredExecution | null;
  compliance: JagStoredExecution | null;
  decisionCount: number;
}): JagBriefingSection {
  const bullets = [
    `Kind: ${briefingKindLabel(input.kind)}`,
    `Scope: ${input.scope} · ${input.organizationNames.join(", ")}`,
    `Window: ${input.window.label} (${input.window.start.slice(0, 10)} → ${input.window.end.slice(0, 10)})`,
    `School Health bound: ${input.health ? "yes" : "no"}`,
    `Executive Briefing bound: ${input.boundBrief ? "yes" : "no"}`,
    `Executions in window: ${input.executions.length}`,
    `Operational readiness: ${input.ops ? input.ops.resultSummary : "not bound"}`,
    `Funding readiness: ${input.funding ? input.funding.resultSummary : "not bound"}`,
    `Student success: ${input.student ? input.student.resultSummary : "not bound"}`,
    `Compliance: ${input.compliance ? input.compliance.resultSummary : "not bound"}`,
    `Decision Center items: ${input.decisionCount}`,
    "Share/export: print, PDF (via print), board mode, read-only share link — email delivery future.",
  ];
  return section("appendix", {
    narrative:
      "Source inventory for this briefing. Nothing in the appendix is fabricated.",
    bullets,
    confidence: null,
    evidenceReferences: [],
    contributorSources: uniqueStrings(
      [
        input.health ? "education.cognition.school_health" : null,
        input.boundBrief ? "education.cognition.executive_briefing" : null,
        input.ops?.contributorId,
        input.funding?.contributorId,
        input.student?.contributorId,
        input.compliance?.contributorId,
        ...input.executions.map((e) => e.contributorId),
      ].filter((x): x is string => Boolean(x))
    ),
    policyReferences: [],
    recommendations: [],
    decisionIds: [],
    availableActions: ["create_follow_up", "add_executive_note", "schedule_review"],
  });
}

function evidenceFromExecution(
  execution: JagStoredExecution
): JagBriefingEvidenceRef[] {
  return (execution.detail?.evidence ?? []).map((e) => ({
    id: e.id,
    source: e.source || execution.contributorId,
    code:
      typeof e.attributes?.code === "string" ? e.attributes.code : undefined,
    summary:
      typeof e.attributes?.summary === "string"
        ? e.attributes.summary
        : typeof e.attributes?.message === "string"
          ? e.attributes.message
          : execution.resultSummary,
  }));
}

function policiesFromExecution(execution: JagStoredExecution): string[] {
  const fromEvidence = (execution.detail?.evidence ?? [])
    .filter(
      (e) =>
        (typeof e.attributes?.code === "string" &&
          e.attributes.code.includes("policy")) ||
        e.source.includes("policy")
    )
    .map((e) =>
      typeof e.attributes?.summary === "string"
        ? e.attributes.summary
        : typeof e.attributes?.code === "string"
          ? e.attributes.code
          : e.id
    );
  const fromLaws = (execution.detail?.recommendations ?? []).flatMap(
    (r) => r.constitutionalTrace?.laws ?? []
  );
  return [...fromEvidence, ...fromLaws];
}

function avg(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function uniqueEvidence(
  values: readonly JagBriefingEvidenceRef[]
): JagBriefingEvidenceRef[] {
  const map = new Map<string, JagBriefingEvidenceRef>();
  for (const v of values) {
    if (!map.has(v.id)) map.set(v.id, v);
  }
  return [...map.values()];
}

function countSources(flags: {
  health: boolean;
  boundBrief: boolean;
  executions: number;
  ops: boolean;
  funding: boolean;
  student: boolean;
  decisions: number;
}): number {
  let n = 0;
  if (flags.health) n += 1;
  if (flags.boundBrief) n += 1;
  if (flags.executions > 0) n += 1;
  if (flags.ops) n += 1;
  if (flags.funding) n += 1;
  if (flags.student) n += 1;
  if (flags.decisions > 0) n += 1;
  return n;
}
