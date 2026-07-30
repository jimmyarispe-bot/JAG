/**
 * Build WatcherEvaluationContext from Command Center stores — Sprint 206.
 */

import {
  StrategyService,
  type StrategyWorkspaceBundle,
} from "@/lib/platform/intelligence/strategy/index";
import { MemoryService } from "@/lib/platform/intelligence/memory/index";
import type {
  WatcherEvaluationContext,
  WatcherSignal,
} from "@/lib/platform/intelligence/watchers/index";
import { loadDecisionCenter } from "../decision-center/query";
import { loadForecastsView } from "../predictive/load-forecasts";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export function buildWatcherEvaluationContext(input: {
  readonly session: JagPlatformSession;
  readonly organizationId: string;
  readonly organizationName: string;
}): WatcherEvaluationContext {
  StrategyService.ensureOrganization(
    input.organizationId,
    input.organizationName
  );
  const strategy: StrategyWorkspaceBundle = StrategyService.workspace(
    input.organizationId,
    input.organizationName
  );

  const decisions = loadDecisionCenter(input.session, {
    organizationId: input.organizationId,
  });
  const open = decisions.decisions.filter(
    (d) =>
      d.status !== "Completed" &&
      d.status !== "Outcome Reviewed" &&
      d.status !== "Dismissed" &&
      d.status !== "Deferred"
  );
  const overdue = open.filter((d) => d.isOverdue);

  const forecasts = loadForecastsView(input.session, {
    organizationId: input.organizationId,
  });

  const memory = MemoryService.search(input.organizationId, {});

  const signals: WatcherSignal[] = [];

  for (const d of overdue.slice(0, 8)) {
    signals.push({
      id: `sig-overdue-${d.id}`,
      kind: "overdue_decision",
      label: d.title,
      score: d.priority === "P1" ? 0.9 : d.priority === "P2" ? 0.75 : 0.6,
      confidence: d.confidence,
      summary: `Overdue decision: ${d.title} (${d.priority})`,
      decisionId: d.id,
      tags: [d.category, "overdue", "decision"],
    });
  }

  for (const card of forecasts.cards.slice(0, 6)) {
    if (card.insufficientData) continue;
    const adverse =
      card.trend === "declining" ||
      card.riskLevel === "high" ||
      card.riskLevel === "critical" ||
      card.confidence < 0.45;
    if (!adverse) continue;
    signals.push({
      id: `sig-fc-${card.id}`,
      kind: "forecast",
      label: card.title,
      score:
        card.riskLevel === "critical"
          ? 0.88
          : card.riskLevel === "high"
            ? 0.72
            : card.confidence < 0.45
              ? 0.55
              : 0.48,
      confidence: card.confidence,
      summary:
        card.confidence < 0.45
          ? `Forecast confidence decreased for ${card.title}`
          : `Adverse forecast trend for ${card.title} (${card.trend})`,
      forecastId: card.id,
      tags: ["forecast", card.trend, card.riskLevel, "confidence"],
    });
  }

  for (const goal of strategy.goals) {
    if (goal.health === "at_risk" || goal.health === "blocked") {
      signals.push({
        id: `sig-goal-${goal.id}`,
        kind: "goal",
        label: goal.title,
        score: goal.health === "blocked" ? 0.85 : 0.7,
        confidence: goal.confidence,
        summary: `Goal ${goal.health}: ${goal.title}`,
        goalId: goal.id,
        tags: ["goal", goal.health, goal.priority],
      });
    }
  }

  for (const init of strategy.initiatives) {
    if (init.status === "behind" || init.status === "blocked") {
      signals.push({
        id: `sig-init-${init.id}`,
        kind: "initiative",
        label: init.title,
        score: 0.62,
        confidence: 0.65,
        summary: `Initiative ${init.status}: ${init.title}`,
        tags: ["initiative", init.status, "operations"],
      });
    }
  }

  // Funding / enrollment hints from strategy scorecard + memory
  for (const risk of strategy.forecast.strategicRisks.slice(0, 4)) {
    signals.push({
      id: `sig-sr-${risk.slice(0, 24)}`,
      kind: "strategic_risk",
      label: risk,
      score: 0.58,
      confidence: strategy.forecast.confidence,
      summary: risk,
      tags: [/funding/i.test(risk) ? "funding" : "strategy", "risk"],
    });
  }

  for (const pattern of memory.patterns.slice(0, 4)) {
    signals.push({
      id: `sig-mem-${pattern.id}`,
      kind: "memory_pattern",
      label: pattern.label,
      score: Math.min(0.75, 0.4 + pattern.occurrenceCount * 0.05),
      confidence: pattern.confidence,
      summary: pattern.summary,
      tags: [pattern.kind, "memory", "pattern"],
    });
  }

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    evaluatedAt: new Date().toISOString(),
    signals,
    openDecisionCount: open.length,
    overdueDecisionCount: overdue.length,
    goalsAtRisk: strategy.scorecard.goalsAtRisk,
    goalsBlocked: strategy.scorecard.blockedGoals,
    initiativesBehind: strategy.scorecard.initiativesBehind,
    missionTrend: strategy.forecast.missionProgressTrend,
    alignmentScore: strategy.alignmentScore,
    memoryPatternSummaries: memory.patterns.map((p) => p.summary).slice(0, 6),
    forecastRisks: forecasts.cards
      .filter((c) => !c.insufficientData && c.riskLevel !== "low")
      .map((c) => c.title)
      .slice(0, 6),
  };
}
