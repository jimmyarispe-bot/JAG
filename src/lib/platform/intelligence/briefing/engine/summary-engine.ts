/**
 * Sprint 062 — executive summary + today's focus composition.
 */

import type {
  BriefingCard,
  BriefingPreferences,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/briefing/types";
import { cardActions } from "@/lib/platform/intelligence/briefing/cards/actions";
import {
  computePriorityScore,
  scoresFromLight,
  sortByPriority,
} from "@/lib/platform/intelligence/briefing/cards/priority";

export function buildExecutiveSummaryText(
  synthesis: SynthesisResultLight | undefined,
  greetingName: string
): string {
  if (!synthesis) {
    return `${greetingName}, no synthesis inputs were available. Monitoring continues; reopen after the next intelligence run.`;
  }

  const fromBrief = synthesis.brief?.executiveSummary;
  if (fromBrief?.trim()) return fromBrief;

  const insight = synthesis.insights?.[0];
  if (insight?.summary) return insight.summary;

  return `Cross-domain synthesis reviewed ${synthesis.contributingDomains?.length ?? 0} domain(s). Priority attention is required on the ranked risks and decisions below.`;
}

export function buildTodaysFocus(
  cards: BriefingCard[],
  createId: (prefix: string) => string,
  limit = 3
): BriefingCard[] {
  const focus = sortByPriority(cards).slice(0, limit).map((card, i) => ({
    ...card,
    id: createId(`focus-${i}`),
    kind: "focus" as const,
    title: card.title,
    summary: card.summary,
    actions: cardActions("focus"),
  }));
  return focus;
}

export function buildRecommendedActionCards(
  synthesis: SynthesisResultLight | undefined,
  createId: (prefix: string) => string,
  preferences: BriefingPreferences
): BriefingCard[] {
  const actions = [
    ...(synthesis?.brief?.recommendedActions ?? []),
    ...((synthesis?.recommendations ?? []).flatMap((r) => r.recommendedActions ?? [])),
    ...((synthesis?.insights ?? []).flatMap((i) =>
      (i.recommendations ?? []).flatMap((r) => r.recommendedActions ?? [])
    )),
  ];
  const unique = [...new Set(actions.filter(Boolean))].slice(0, 6);
  const scores = scoresFromLight(synthesis?.insights?.[0]?.scores);
  const domains = synthesis?.contributingDomains ?? [];

  return unique.map((action, i) => ({
    id: createId(`action-${i}`),
    kind: "action" as const,
    title: action.length > 72 ? `${action.slice(0, 69)}…` : action,
    summary: action,
    priorityScore: computePriorityScore(scores) - i,
    severity: scores.severity,
    urgency: scores.urgency,
    confidence: scores.confidence,
    businessImpact: scores.businessImpact,
    strategicAlignment: scores.strategicAlignment,
    domains: preferences.emphasizeDomains?.length
      ? preferences.emphasizeDomains
      : domains,
    explainability: {
      why: `Recommended because synthesis ranked this among the highest-leverage next actions for ${preferences.role}.`,
      contributingDomains: domains,
      confidence: scores.confidence,
      supportingEvidence: [
        {
          id: createId(`action-ev-${i}`),
          domain: domains[0] ?? "synthesis",
          statement: action,
          weight: 0.7,
          supporting: true,
        },
      ],
    },
    actions: cardActions("action"),
  }));
}
