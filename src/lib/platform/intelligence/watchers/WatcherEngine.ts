/**
 * WatcherEngine — evaluate organizational signals into candidate alerts — Sprint 206.
 * Quality over quantity. Never executes decisions.
 */

import type { WatcherCandidate, WatcherEvaluationContext } from "./WatcherEvaluation";
import { priorityFromScore } from "./WatcherPriority";
import { WatcherRegistry } from "./WatcherRegistry";
import type { WatcherPriority, WatcherType } from "./WatcherRule";

const ADVISORY =
  "Autonomous executive intelligence surfaces findings for attention — JAG never executes organizational decisions.";

function fingerprintKey(
  type: WatcherType,
  organizationId: string,
  topic: string
): string {
  return `${organizationId}|${type}|${topic.toLowerCase().replace(/\s+/g, "_").slice(0, 80)}`;
}

function candidate(input: {
  type: WatcherType;
  title: string;
  summary: string;
  score: number;
  confidence: number;
  drivers: readonly string[];
  action: string;
  decisionIds?: readonly string[];
  goalIds?: readonly string[];
  memoryIds?: readonly string[];
  evidenceSummaries?: readonly string[];
  forecasts?: readonly string[];
  scenarios?: readonly string[];
  memory?: readonly string[];
  contributors?: readonly string[];
  organizationId: string;
  topic: string;
}): WatcherCandidate | null {
  const rule = WatcherRegistry.getByType(input.type);
  if (!rule || !rule.enabled) return null;
  if (input.score < rule.threshold) return null;

  const severity: WatcherPriority =
    priorityFromScore(input.score) === "informational" &&
    rule.defaultPriority !== "informational"
      ? rule.defaultPriority
      : priorityFromScore(Math.max(input.score, rule.threshold));

  return {
    watcherId: rule.id,
    type: input.type,
    title: input.title,
    summary: input.summary,
    severity,
    score: Number(input.score.toFixed(3)),
    confidence: Number(Math.min(0.95, input.confidence).toFixed(3)),
    evidence: (input.evidenceSummaries ?? [input.summary]).slice(0, 4).map(
      (s, i) => ({
        id: `ev-${input.type}-${i}`,
        source: rule.label,
        summary: s,
      })
    ),
    primaryDrivers: input.drivers.slice(0, 5),
    supportingContributors: input.contributors ?? [
      "jag.autonomous_executive_intelligence",
    ],
    recommendedExecutiveAction: input.action,
    relatedDecisionIds: input.decisionIds ?? [],
    relatedGoalIds: input.goalIds ?? [],
    relatedMemoryIds: input.memoryIds ?? [],
    policies: [],
    forecasts: input.forecasts ?? [],
    scenarios: input.scenarios ?? [],
    memory: input.memory ?? [],
    fingerprintKey: fingerprintKey(input.type, input.organizationId, input.topic),
  };
}

export function evaluateWatchers(
  ctx: WatcherEvaluationContext
): {
  readonly candidates: readonly WatcherCandidate[];
  readonly durationMs: number;
  readonly advisoryNotice: string;
} {
  const started = Date.now();
  const out: WatcherCandidate[] = [];
  const org = ctx.organizationId;

  // Goal drift / strategic risk
  if (ctx.goalsAtRisk.length > 0) {
    const c = candidate({
      type: "goal_drift",
      organizationId: org,
      topic: `goals_at_risk_${ctx.goalsAtRisk[0]}`,
      title: "Goal is projected to miss target",
      summary: `${ctx.goalsAtRisk.length} goal(s) at risk: ${ctx.goalsAtRisk.slice(0, 3).join("; ")}.`,
      score: Math.min(0.95, 0.5 + ctx.goalsAtRisk.length * 0.1),
      confidence: 0.72,
      drivers: ctx.goalsAtRisk.slice(0, 3),
      action: "Review goal health and intervene before the target date slips further.",
      evidenceSummaries: ctx.goalsAtRisk.slice(0, 3),
    });
    if (c) out.push(c);

    const s = candidate({
      type: "strategic_risk",
      organizationId: org,
      topic: "strategic_goal_risk",
      title: "Strategic risk elevated",
      summary: `Mission trend ${ctx.missionTrend}; alignment ${(ctx.alignmentScore * 100).toFixed(0)}%. Goals at risk require attention.`,
      score: Math.min(0.92, 0.48 + (1 - ctx.alignmentScore) * 0.4),
      confidence: 0.7,
      drivers: [`Mission trend: ${ctx.missionTrend}`, ...ctx.goalsAtRisk.slice(0, 2)],
      action: "Open Strategic Intelligence and stabilize at-risk goals.",
    });
    if (s) out.push(s);
  }

  if (ctx.goalsBlocked.length > 0) {
    const c = candidate({
      type: "strategic_risk",
      organizationId: org,
      topic: `blocked_${ctx.goalsBlocked[0]}`,
      title: "Blocked strategic goal",
      summary: `Blocked: ${ctx.goalsBlocked.slice(0, 3).join("; ")}.`,
      score: 0.78,
      confidence: 0.75,
      drivers: ctx.goalsBlocked.slice(0, 3),
      action: "Unblock ownership, dependencies, or escalate for executive decision.",
    });
    if (c) out.push(c);
  }

  if (ctx.initiativesBehind.length > 0) {
    const c = candidate({
      type: "operational_risk",
      organizationId: org,
      topic: `init_behind_${ctx.initiativesBehind[0]}`,
      title: "Initiatives behind schedule",
      summary: `${ctx.initiativesBehind.length} initiative(s) behind: ${ctx.initiativesBehind.slice(0, 3).join("; ")}.`,
      score: Math.min(0.88, 0.5 + ctx.initiativesBehind.length * 0.08),
      confidence: 0.68,
      drivers: ctx.initiativesBehind.slice(0, 3),
      action: "Replan initiative capacity or re-prioritize delivery.",
    });
    if (c) out.push(c);
  }

  // Decision risk
  if (ctx.overdueDecisionCount > 0) {
    const overdueSignals = ctx.signals.filter((s) => s.kind === "overdue_decision");
    const c = candidate({
      type: "decision_risk",
      organizationId: org,
      topic: "overdue_decisions",
      title: "High-risk decision overdue",
      summary: `${ctx.overdueDecisionCount} overdue decision(s) in the executive queue.`,
      score: Math.min(0.95, 0.55 + ctx.overdueDecisionCount * 0.08),
      confidence: 0.8,
      drivers: overdueSignals.slice(0, 3).map((s) => s.label),
      action: "Clear overdue decisions today — defer only with explicit rationale.",
      decisionIds: overdueSignals
        .map((s) => s.decisionId)
        .filter((id): id is string => Boolean(id)),
      evidenceSummaries: overdueSignals.slice(0, 3).map((s) => s.summary),
    });
    if (c) out.push(c);
  }

  // Funding / enrollment / compliance from tagged signals
  for (const signal of ctx.signals) {
    const tags = (signal.tags ?? []).map((t) => t.toLowerCase());
    const hay = `${signal.label} ${signal.summary} ${tags.join(" ")}`.toLowerCase();

    if (/funding|budget|renewal|shortfall/.test(hay) && signal.score >= 0.4) {
      const c = candidate({
        type: "funding_risk",
        organizationId: org,
        topic: `funding_${signal.id}`,
        title: /renewal/.test(hay)
          ? "Funding renewal approaching"
          : "Funding risk detected",
        summary: signal.summary,
        score: signal.score,
        confidence: signal.confidence,
        drivers: [signal.label],
        action: "Review funding readiness and related decisions.",
        decisionIds: signal.decisionId ? [signal.decisionId] : [],
        forecasts: signal.forecastId ? [signal.forecastId] : [],
      });
      if (c) out.push(c);
    }

    if (/enrollment|attendance/.test(hay) && signal.score >= 0.4) {
      const c = candidate({
        type: "enrollment_risk",
        organizationId: org,
        topic: `enrollment_${signal.id}`,
        title: /attendance/.test(hay)
          ? "Attendance trend resembles previous decline"
          : "Enrollment risk detected",
        summary: signal.summary,
        score: signal.score,
        confidence: signal.confidence,
        drivers: [signal.label],
        action: "Compare with institutional memory and stabilize enrollment drivers.",
        memoryIds: signal.memoryId ? [signal.memoryId] : [],
        memory: ctx.memoryPatternSummaries.slice(0, 2),
      });
      if (c) out.push(c);
    }

    if (/compliance|audit|policy/.test(hay) && signal.score >= 0.4) {
      const c = candidate({
        type: "compliance_risk",
        organizationId: org,
        topic: `compliance_${signal.id}`,
        title: "Compliance risk requires attention",
        summary: signal.summary,
        score: signal.score,
        confidence: signal.confidence,
        drivers: [signal.label],
        action: "Review compliance posture and overdue policy actions.",
      });
      if (c) out.push(c);
    }

    if (/forecast|confidence|drift/.test(hay) && signal.score >= 0.4) {
      const c = candidate({
        type: "forecast_drift",
        organizationId: org,
        topic: `forecast_${signal.id}`,
        title: /confidence/.test(hay)
          ? "Forecast confidence decreased"
          : "Forecast drift detected",
        summary: signal.summary,
        score: signal.score,
        confidence: signal.confidence,
        drivers: [signal.label],
        action: "Revisit forecast assumptions and related scenarios.",
        forecasts: signal.forecastId
          ? [signal.forecastId]
          : ctx.forecastRisks.slice(0, 2),
        scenarios: signal.scenarioId ? [signal.scenarioId] : [],
      });
      if (c) out.push(c);
    }

    if (/scenario|assumption/.test(hay) && signal.score >= 0.45) {
      const c = candidate({
        type: "executive_attention",
        organizationId: org,
        topic: `scenario_${signal.id}`,
        title: "Scenario assumptions invalidated",
        summary: signal.summary,
        score: signal.score,
        confidence: signal.confidence,
        drivers: [signal.label],
        action: "Re-run Scenario Planner with updated assumptions.",
        scenarios: signal.scenarioId ? [signal.scenarioId] : [],
      });
      if (c) out.push(c);
    }

    if (/opportunity|improve|growth/.test(hay) && signal.score >= 0.5) {
      const c = candidate({
        type: "opportunity_detection",
        organizationId: org,
        topic: `opp_${signal.id}`,
        title: "Opportunity detected",
        summary: signal.summary,
        score: signal.score * 0.9,
        confidence: signal.confidence,
        drivers: [signal.label],
        action: "Assess opportunity against mission pillars before committing.",
      });
      if (c) out.push(c);
    }
  }

  // Memory patterns → attendance / recurring risks
  for (const pattern of ctx.memoryPatternSummaries.slice(0, 3)) {
    if (/attendance|funding|turnover|compliance/i.test(pattern)) {
      const c = candidate({
        type: "executive_attention",
        organizationId: org,
        topic: `memory_${pattern.slice(0, 40)}`,
        title: "Institutional pattern warrants attention",
        summary: pattern,
        score: 0.55,
        confidence: 0.65,
        drivers: [pattern],
        action: "Review Organizational Memory for similar situations and lessons.",
        memory: [pattern],
      });
      if (c) out.push(c);
    }
  }

  // Cap quantity — quality over quantity
  const ranked = [...out].sort((a, b) => b.score - a.score).slice(0, 12);

  return {
    candidates: ranked,
    durationMs: Date.now() - started,
    advisoryNotice: ADVISORY,
  };
}
