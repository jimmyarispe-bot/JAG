/**
 * Deterministic executive briefing synthesis from Command Center stores.
 * No LLM. No invented metrics. Application layer only.
 */

import { createHash } from "node:crypto";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  getDecisionCompletedAt,
  getDecisionFeedback,
  getDecisionOutcome,
} from "../decision-center/execution-store";
import { loadDecisionCenter } from "../decision-center/query";
import {
  getStoredExecutiveBrief,
  getStoredSchoolHealth,
  listStoredExecutions,
  type JagStoredExecution,
} from "../intelligence-store";
import { isWithinWindow, resolveBriefingWindow } from "./timeline";
import type {
  JagBriefingEvidenceRef,
  JagBriefingSection,
  JagBriefingSectionId,
  JagBriefingTimeline,
  JagBriefingWindow,
  JagExecutiveBriefing,
} from "./types";

/** Known Education contributor ids — referenced as strings (no Domain SDK edits). */
const OPERATIONAL_READINESS_ID = "education.cognition.operational_readiness";
const FUNDING_READINESS_ID = "education.cognition.funding_readiness";
const STUDENT_SUCCESS_ID = "education.cognition.student_success";

const SECTION_TITLES: Record<JagBriefingSectionId, string> = {
  executive_summary: "Executive Summary",
  todays_priorities: "Today's Priorities",
  critical_risks: "Critical Risks",
  opportunities: "Opportunities",
  decision_queue_summary: "Decision Queue Summary",
  completed_outcomes: "Completed Outcomes",
  emerging_trends: "Emerging Trends",
  recommended_executive_actions: "Recommended Executive Actions",
  appendix: "Appendix",
};

export function synthesizeExecutiveBriefing(input: {
  session: JagPlatformSession;
  organizationId: string;
  timeline: JagBriefingTimeline;
  customStart?: string;
  customEnd?: string;
  generatedBy: string;
  now?: Date;
}): JagExecutiveBriefing | { error: string } {
  const orgs = listOrganizationsForSession(input.session);
  const org = orgs.find((o) => o.id === input.organizationId);
  if (!org) {
    return { error: "Organization not found for this session." };
  }

  const windowResult = resolveBriefingWindow({
    timeline: input.timeline,
    now: input.now,
    customStart: input.customStart,
    customEnd: input.customEnd,
  });
  if ("error" in windowResult) return windowResult;
  const window = windowResult;

  const health = getStoredSchoolHealth(org.id);
  const boundBrief = getStoredExecutiveBrief(org.id);
  const executions = listStoredExecutions(org.id, 100).filter((e) =>
    isWithinWindow(e.analyzedAt, window)
  );
  const allExecutions = listStoredExecutions(org.id, 100);
  const decisions = loadDecisionCenter(input.session, {
    organizationId: org.id,
  }).decisions.filter((d) => d.organizationId === org.id);

  const openDecisions = decisions.filter(
    (d) =>
      d.status !== "Completed" &&
      d.status !== "Outcome Reviewed" &&
      d.status !== "Dismissed"
  );
  const completedInWindow = decisions.filter((d) => {
    if (d.status !== "Completed" && d.status !== "Outcome Reviewed") return false;
    const at = getDecisionCompletedAt(d.id);
    return isWithinWindow(at ?? undefined, window);
  });

  const ops = pickContributor(allExecutions, OPERATIONAL_READINESS_ID, window);
  const funding = pickContributor(allExecutions, FUNDING_READINESS_ID, window);
  const student = pickContributor(allExecutions, STUDENT_SUCCESS_ID, window);

  const sections: JagBriefingSection[] = [
    sectionExecutiveSummary({
      orgName: org.name,
      window,
      health,
      boundBrief,
      openCount: openDecisions.length,
      completedCount: completedInWindow.length,
      executions,
      ops,
      funding,
      student,
    }),
    sectionTodaysPriorities(openDecisions),
    sectionCriticalRisks({ health, boundBrief, executions, openDecisions }),
    sectionOpportunities({ boundBrief, executions, student, funding }),
    sectionDecisionQueue(openDecisions, decisions),
    sectionCompletedOutcomes(completedInWindow),
    sectionEmergingTrends({ executions, health, ops, funding, student }),
    sectionRecommendedActions({
      openDecisions,
      boundBrief,
      executions,
    }),
    sectionAppendix({
      window,
      health,
      boundBrief,
      executions,
      ops,
      funding,
      student,
      decisionCount: decisions.length,
    }),
  ];

  const confidences = sections
    .map((s) => s.confidence)
    .filter((c): c is number => typeof c === "number");
  const overallConfidence =
    confidences.length === 0
      ? null
      : confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const hasSubstance = sections.some(
    (s) => s.bullets.length > 0 && !s.emptyReason
  );

  const generatedAt = (input.now ?? new Date()).toISOString();
  const id = createHash("sha256")
    .update(
      `${org.id}|${window.timeline}|${window.start}|${window.end}|${generatedAt}`
    )
    .digest("hex")
    .slice(0, 24);

  return {
    id,
    organizationId: org.id,
    organizationName: org.name,
    generatedAt,
    generatedBy: input.generatedBy,
    window,
    title: `Executive Briefing · ${org.name} · ${window.label}`,
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
    hasSubstance,
  };
}

function pickContributor(
  executions: readonly JagStoredExecution[],
  contributorId: string,
  window: JagBriefingWindow
): JagStoredExecution | null {
  const inWindow = executions.filter(
    (e) => e.contributorId === contributorId && isWithinWindow(e.analyzedAt, window)
  );
  if (inWindow[0]) return inWindow[0];
  // Fall back to latest bound run outside window so readiness sections can still cite
  // real data — mark via analyzedAt remaining on the execution.
  return (
    executions.find((e) => e.contributorId === contributorId) ?? null
  );
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
    emptyReason,
  });
}

function sectionExecutiveSummary(input: {
  orgName: string;
  window: JagBriefingWindow;
  health: ReturnType<typeof getStoredSchoolHealth>;
  boundBrief: ReturnType<typeof getStoredExecutiveBrief>;
  openCount: number;
  completedCount: number;
  executions: readonly JagStoredExecution[];
  ops: JagStoredExecution | null;
  funding: JagStoredExecution | null;
  student: JagStoredExecution | null;
}): JagBriefingSection {
  const parts: string[] = [];
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
    for (const r of input.boundBrief.criticalRisks.slice(0, 2)) {
      bullets.push(`Risk signal: ${r}`);
    }
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
  bullets.push(
    `Contributor executions in window: ${input.executions.length}`
  );

  for (const exec of [input.ops, input.funding, input.student]) {
    if (!exec) continue;
    contributors.add(exec.contributorId);
    confidences.push(exec.confidence);
    bullets.push(`${exec.label}: ${exec.resultSummary}`);
    evidence.push(...evidenceFromExecution(exec).slice(0, 2));
    policies.push(...policiesFromExecution(exec));
  }

  if (parts.length === 0 && !input.health && !input.boundBrief) {
    return emptySection(
      "executive_summary",
      `No bound Organization Health or Executive Briefing for ${input.orgName} in this window. Bind an Education Intelligence snapshot to synthesize a summary.`,
      ["education.cognition.school_health", "education.cognition.executive_briefing"]
    );
  }

  return section("executive_summary", {
    narrative:
      parts.join(" ") ||
      `Executive posture for ${input.orgName} over ${input.window.label}, synthesized from bound Command Center intelligence.`,
    bullets,
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
  });
}

function sectionTodaysPriorities(
  openDecisions: readonly {
    id: string;
    title: string;
    priority: string;
    status: string;
    recommendedAction: string;
    contributorId: string;
    confidence: number;
  }[]
): JagBriefingSection {
  const top = [...openDecisions]
    .sort((a, b) => a.priority.localeCompare(b.priority))
    .slice(0, 5);
  if (top.length === 0) {
    return emptySection(
      "todays_priorities",
      "No open Decision Center items for this organization."
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
  });
}

function sectionCriticalRisks(input: {
  health: ReturnType<typeof getStoredSchoolHealth>;
  boundBrief: ReturnType<typeof getStoredExecutiveBrief>;
  executions: readonly JagStoredExecution[];
  openDecisions: readonly {
    id: string;
    title: string;
    priority: string;
    isOverdue: boolean;
    contributorId: string;
    confidence: number;
  }[];
}): JagBriefingSection {
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const policies: string[] = [];
  const confidences: number[] = [];

  if (input.boundBrief?.criticalRisks.length) {
    for (const r of input.boundBrief.criticalRisks) bullets.push(r);
    contributors.add("education.cognition.executive_briefing");
    confidences.push(input.boundBrief.confidence);
  }
  if (input.health && (input.health.riskLevel === "high" || input.health.stance === "at_risk" || input.health.stance === "critical")) {
    bullets.push(
      `School Health risk level ${input.health.riskLevel} · stance ${input.health.stance}`
    );
    contributors.add("education.cognition.school_health");
    confidences.push(input.health.confidence);
    evidence.push({
      id: `health-risk:${input.health.capturedAt}`,
      source: "education.cognition.school_health",
      summary: input.health.explanation,
      code: "risk",
    });
  }
  for (const d of input.openDecisions.filter((x) => x.isOverdue || x.priority === "P1")) {
    bullets.push(
      `${d.isOverdue ? "Overdue" : "P1"} decision: ${d.title}`
    );
    contributors.add(d.contributorId);
    confidences.push(d.confidence);
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
      confidences.push(e.confidence);
    }
    evidence.push(...evidenceFromExecution(e).slice(0, 1));
    policies.push(...policiesFromExecution(e));
  }

  if (bullets.length === 0) {
    return emptySection(
      "critical_risks",
      "No critical risks bound from School Health, Executive Briefing, or open P1/overdue decisions."
    );
  }

  return section("critical_risks", {
    narrative: "Critical risks synthesized from health posture, briefing signals, and the decision queue.",
    bullets: bullets.slice(0, 10),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
  });
}

function sectionOpportunities(input: {
  boundBrief: ReturnType<typeof getStoredExecutiveBrief>;
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

  for (const e of input.executions) {
    for (const rec of e.detail?.recommendations ?? []) {
      if (rec.priority >= 3) continue;
      bullets.push(`Recommendation: ${rec.title}`);
      contributors.add(e.contributorId);
      confidences.push(rec.confidence);
      evidence.push({
        id: rec.id,
        source: e.contributorId,
        summary: rec.explanation,
      });
      for (const law of rec.constitutionalTrace?.laws ?? []) {
        policies.push(law);
      }
    }
  }

  if (bullets.length === 0) {
    return emptySection(
      "opportunities",
      "No opportunity signals from strategic priorities, student success, or funding readiness."
    );
  }

  return section("opportunities", {
    narrative: "Opportunities drawn from strategic priorities and positive readiness signals.",
    bullets: bullets.slice(0, 10),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
  });
}

function sectionDecisionQueue(
  openDecisions: readonly {
    id: string;
    title: string;
    status: string;
    priority: string;
    categoryLabel: string;
    contributorId: string;
    confidence: number;
    assignment: { summary: string } | null;
  }[],
  allDecisions: readonly { status: string }[]
): JagBriefingSection {
  if (allDecisions.length === 0) {
    return emptySection(
      "decision_queue_summary",
      "No Decision Center proposals are projected for this organization."
    );
  }
  const byStatus = new Map<string, number>();
  for (const d of allDecisions) {
    byStatus.set(d.status, (byStatus.get(d.status) ?? 0) + 1);
  }
  const bullets = [
    ...[...byStatus.entries()].map(([s, n]) => `${s}: ${n}`),
    ...openDecisions.slice(0, 5).map(
      (d) =>
        `${d.priority} · ${d.title} · ${d.status}${
          d.assignment ? ` · ${d.assignment.summary}` : ""
        }`
    ),
  ];
  return section("decision_queue_summary", {
    narrative: `Decision Center holds ${allDecisions.length} projected decisions (${openDecisions.length} open).`,
    bullets,
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
  });
}

function sectionCompletedOutcomes(
  completed: readonly {
    id: string;
    title: string;
    contributorId: string;
    confidence: number;
    outcomeResult: string | null;
  }[]
): JagBriefingSection {
  if (completed.length === 0) {
    return emptySection(
      "completed_outcomes",
      "No decisions reached Completed or Outcome Reviewed in this timeline window."
    );
  }
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors: string[] = [];
  const confidences: number[] = [];

  for (const d of completed) {
    const outcome = getDecisionOutcome(d.id);
    const feedback = getDecisionFeedback(d.id);
    contributors.push(d.contributorId);
    confidences.push(outcome?.confidence ?? d.confidence);
    if (outcome) {
      bullets.push(
        `${d.title}: ${outcome.result} — expected “${outcome.expectedOutcome}”; actual “${outcome.actualOutcome}”`
      );
      if (outcome.lessonsLearned) {
        bullets.push(`Lesson: ${outcome.lessonsLearned}`);
      }
    } else {
      bullets.push(`${d.title}: completed (outcome not yet reviewed)`);
    }
    if (feedback) {
      bullets.push(
        `Feedback: achieved=${feedback.achievedIntendedResult ? "yes" : "no"}; future priority ${feedback.futurePriority}`
      );
    }
    evidence.push({
      id: d.id,
      source: "decision-center.outcome",
      summary: d.title,
      code: outcome?.result ?? "completed",
    });
  }

  return section("completed_outcomes", {
    narrative: `${completed.length} decision outcome(s) closed in the selected window.`,
    bullets: bullets.slice(0, 12),
    confidence: avg(confidences),
    evidenceReferences: evidence,
    contributorSources: uniqueStrings(contributors),
    policyReferences: [],
  });
}

function sectionEmergingTrends(input: {
  executions: readonly JagStoredExecution[];
  health: ReturnType<typeof getStoredSchoolHealth>;
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

  for (const exec of [input.ops, input.funding, input.student, ...input.executions]) {
    if (!exec) continue;
    contributors.add(exec.contributorId);
    confidences.push(exec.confidence);
    bullets.push(
      `${exec.label} readiness ${exec.detail?.readiness ?? "unknown"} · conf ${exec.confidence.toFixed(2)}`
    );
    for (const w of exec.detail?.warnings ?? []) {
      bullets.push(`Warning (${exec.label}): ${w}`);
    }
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
  });
}

function sectionRecommendedActions(input: {
  openDecisions: readonly {
    id: string;
    title: string;
    recommendedAction: string;
    priority: string;
    contributorId: string;
    confidence: number;
  }[];
  boundBrief: ReturnType<typeof getStoredExecutiveBrief>;
  executions: readonly JagStoredExecution[];
}): JagBriefingSection {
  const bullets: string[] = [];
  const evidence: JagBriefingEvidenceRef[] = [];
  const contributors = new Set<string>();
  const policies: string[] = [];
  const confidences: number[] = [];

  if (input.boundBrief?.recommendedActions.length) {
    for (const a of input.boundBrief.recommendedActions) {
      bullets.push(a);
    }
    contributors.add("education.cognition.executive_briefing");
    confidences.push(input.boundBrief.confidence);
  }

  for (const d of input.openDecisions.slice(0, 5)) {
    bullets.push(`${d.priority}: ${d.recommendedAction}`);
    contributors.add(d.contributorId);
    confidences.push(d.confidence);
    evidence.push({
      id: d.id,
      source: "decision-center",
      summary: d.title,
    });
  }

  for (const e of input.executions) {
    for (const action of e.suggestedActions.slice(0, 2)) {
      bullets.push(`${action.label}: ${action.rationale}`);
      contributors.add(e.contributorId);
      confidences.push(e.confidence);
      evidence.push({
        id: action.actionId,
        source: e.contributorId,
        summary: action.label,
      });
    }
    policies.push(...policiesFromExecution(e));
  }

  if (bullets.length === 0) {
    return emptySection(
      "recommended_executive_actions",
      "No recommended executive actions available from bound brief or decision proposals."
    );
  }

  return section("recommended_executive_actions", {
    narrative: "Recommended executive actions from the bound briefing and open proposals.",
    bullets: uniqueStrings(bullets).slice(0, 12),
    confidence: avg(confidences),
    evidenceReferences: uniqueEvidence(evidence),
    contributorSources: [...contributors],
    policyReferences: uniqueStrings(policies),
  });
}

function sectionAppendix(input: {
  window: JagBriefingWindow;
  health: ReturnType<typeof getStoredSchoolHealth>;
  boundBrief: ReturnType<typeof getStoredExecutiveBrief>;
  executions: readonly JagStoredExecution[];
  ops: JagStoredExecution | null;
  funding: JagStoredExecution | null;
  student: JagStoredExecution | null;
  decisionCount: number;
}): JagBriefingSection {
  const bullets = [
    `Window: ${input.window.label} (${input.window.start.slice(0, 10)} → ${input.window.end.slice(0, 10)})`,
    `School Health bound: ${input.health ? "yes" : "no"}`,
    `Executive Briefing bound: ${input.boundBrief ? "yes" : "no"}`,
    `Executions in window: ${input.executions.length}`,
    `Operational readiness: ${input.ops ? input.ops.resultSummary : "not bound"}`,
    `Funding readiness: ${input.funding ? input.funding.resultSummary : "not bound"}`,
    `Student success: ${input.student ? input.student.resultSummary : "not bound"}`,
    `Decision Center items: ${input.decisionCount}`,
  ];
  const contributors = [
    input.health ? "education.cognition.school_health" : null,
    input.boundBrief ? "education.cognition.executive_briefing" : null,
    input.ops?.contributorId ?? null,
    input.funding?.contributorId ?? null,
    input.student?.contributorId ?? null,
    ...input.executions.map((e) => e.contributorId),
  ].filter((x): x is string => Boolean(x));

  const evidence: JagBriefingEvidenceRef[] = [];
  const policies: string[] = [];
  for (const e of input.executions) {
    evidence.push(...evidenceFromExecution(e));
    policies.push(...policiesFromExecution(e));
  }

  return section("appendix", {
    narrative: "Source inventory for this briefing. Nothing in the appendix is fabricated.",
    bullets,
    confidence: null,
    evidenceReferences: uniqueEvidence(evidence).slice(0, 20),
    contributorSources: uniqueStrings(contributors),
    policyReferences: uniqueStrings(policies),
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
