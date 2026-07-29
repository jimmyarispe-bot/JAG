/**
 * Executive insights — computed only from bound intelligence.
 */

import type { JagDecisionCard } from "../decision-center/types";
import { getDecisionOutcome } from "../decision-center/execution-store";
import type { JagStoredExecution, JagStoredSchoolHealth } from "../intelligence-store";
import type { JagExecutiveInsight } from "./types";

export function computeExecutiveInsights(input: {
  health: JagStoredSchoolHealth | null;
  executions: readonly JagStoredExecution[];
  openDecisions: readonly JagDecisionCard[];
  completedDecisions: readonly JagDecisionCard[];
}): readonly JagExecutiveInsight[] {
  const insights: JagExecutiveInsight[] = [];
  const { health, executions, openDecisions, completedDecisions } = input;

  if (health?.trend) {
    const trend = health.trend.toLowerCase();
    if (trend.includes("improv") || trend.includes("up") || trend === "improving") {
      insights.push({
        kind: "largest_improvement",
        label: "Largest improvement",
        value: health.trend,
        detail: `School Health trend reports improvement (score ${health.healthScore.toFixed(2)}).`,
        decisionId: null,
        decisionHref: null,
        confidence: health.confidence,
      });
    } else if (
      trend.includes("declin") ||
      trend.includes("down") ||
      trend === "deteriorating" ||
      trend.includes("worsen")
    ) {
      insights.push({
        kind: "largest_deterioration",
        label: "Largest deterioration",
        value: health.trend,
        detail: `School Health trend reports deterioration (score ${health.healthScore.toFixed(2)}).`,
        decisionId: null,
        decisionHref: null,
        confidence: health.confidence,
      });
    }
  }

  const scored = executions
    .map((e) => ({ e, c: e.confidence }))
    .sort((a, b) => b.c - a.c);
  if (scored[0]) {
    insights.push({
      kind: "highest_confidence",
      label: "Highest confidence finding",
      value: scored[0].e.label,
      detail: scored[0].e.resultSummary,
      decisionId: null,
      decisionHref: null,
      confidence: scored[0].c,
    });
  }
  if (scored.length > 0) {
    const lowest = scored[scored.length - 1]!;
    insights.push({
      kind: "lowest_confidence",
      label: "Lowest confidence finding",
      value: lowest.e.label,
      detail: lowest.e.resultSummary,
      decisionId: null,
      decisionHref: null,
      confidence: lowest.c,
    });
  }

  const riskDecision =
    openDecisions.find((d) => d.isOverdue && d.priority === "P1") ??
    openDecisions.find((d) => d.priority === "P1") ??
    openDecisions.find((d) => d.isOverdue);
  if (riskDecision) {
    insights.push({
      kind: "fastest_growing_risk",
      label: "Fastest-growing risk",
      value: riskDecision.title,
      detail: riskDecision.recommendedAction,
      decisionId: riskDecision.id,
      decisionHref: `/jag/decisions/${riskDecision.id}`,
      confidence: riskDecision.confidence,
    });
  }

  const opportunity = openDecisions
    .filter((d) => d.category === "funding" || d.category === "students")
    .sort((a, b) => a.priorityRank - b.priorityRank)[0];
  if (opportunity) {
    insights.push({
      kind: "highest_impact_opportunity",
      label: "Highest-impact opportunity",
      value: opportunity.title,
      detail: opportunity.recommendedAction,
      decisionId: opportunity.id,
      decisionHref: `/jag/decisions/${opportunity.id}`,
      confidence: opportunity.confidence,
    });
  }

  let bestCompleted: {
    card: JagDecisionCard;
    confidence: number;
  } | null = null;
  for (const d of completedDecisions) {
    const outcome = getDecisionOutcome(d.id);
    if (outcome?.result !== "success") continue;
    if (!bestCompleted || outcome.confidence > bestCompleted.confidence) {
      bestCompleted = { card: d, confidence: outcome.confidence };
    }
  }
  if (bestCompleted) {
    insights.push({
      kind: "most_successful_completed_decision",
      label: "Most successful completed decision",
      value: bestCompleted.card.title,
      detail: getDecisionOutcome(bestCompleted.card.id)?.actualOutcome ??
        bestCompleted.card.recommendedAction,
      decisionId: bestCompleted.card.id,
      decisionHref: `/jag/decisions/${bestCompleted.card.id}`,
      confidence: bestCompleted.confidence,
    });
  }

  const overdue = openDecisions
    .filter((d) => d.isOverdue)
    .sort((a, b) => {
      const ad = a.assignment?.dueDate ?? "";
      const bd = b.assignment?.dueDate ?? "";
      return ad.localeCompare(bd);
    })[0];
  if (overdue) {
    insights.push({
      kind: "most_overdue_decision",
      label: "Most overdue decision",
      value: overdue.title,
      detail: overdue.assignment?.dueDate
        ? `Due ${overdue.assignment.dueDate.slice(0, 10)} · ${overdue.status}`
        : overdue.status,
      decisionId: overdue.id,
      decisionHref: `/jag/decisions/${overdue.id}`,
      confidence: overdue.confidence,
    });
  }

  return insights;
}
