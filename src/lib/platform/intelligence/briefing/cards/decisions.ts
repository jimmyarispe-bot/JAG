import type {
  DecisionCard,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/briefing/types";
import { cardActions } from "@/lib/platform/intelligence/briefing/cards/actions";
import {
  computePriorityScore,
  scoresFromLight,
  sortByPriority,
} from "@/lib/platform/intelligence/briefing/cards/priority";

export function buildDecisionCards(
  synthesis: SynthesisResultLight | undefined,
  createId: (prefix: string) => string,
  limit = 5
): DecisionCard[] {
  const decisions = collectDecisions(synthesis);
  const insight = synthesis?.insights?.[0];
  const scores = scoresFromLight(insight?.scores);
  const rootCause = insight?.rootCause?.likelyCause ?? "Cross-domain synthesis requires an executive decision.";
  const domains =
    insight?.rootCause?.affectedDomains ??
    synthesis?.contributingDomains ??
    [];

  const cards: DecisionCard[] = decisions.map((decision, i) => {
    const priorityScore = computePriorityScore(scores);
    return {
      id: createId(`decision-${i}`),
      kind: "decision" as const,
      title: decision.length > 80 ? `${decision.slice(0, 77)}…` : decision,
      summary: decision,
      decisionNeeded: decision,
      why: rootCause,
      impactIfDelayed:
        scores.urgency >= 70
          ? "Delay increases enrollment, cash, or continuity risk within the immediate horizon."
          : "Delay prolongs uncertainty and weakens the organization's ability to act coherently.",
      recommendedDecision:
        insight?.recommendations?.[0]?.recommendedActions?.[0] ??
        synthesis?.brief?.recommendedActions?.[0] ??
        "Brief leadership, assign an owner, and schedule a decision review within 48 hours.",
      priorityScore,
      severity: scores.severity,
      urgency: scores.urgency,
      confidence: scores.confidence,
      businessImpact: scores.businessImpact,
      strategicAlignment: scores.strategicAlignment,
      domains,
      explainability: {
        why: `Decision queued because synthesis flagged: ${decision}`,
        contributingDomains: domains,
        confidence: scores.confidence,
        supportingEvidence: insight?.rootCause?.supportingEvidence ?? [
          {
            id: createId(`dec-ev-${i}`),
            domain: domains[0] ?? "synthesis",
            statement: decision,
            weight: 0.75,
            supporting: true,
          },
        ],
      },
      actions: cardActions("decision"),
    };
  });

  return sortByPriority(cards).slice(0, limit);
}

function collectDecisions(synthesis?: SynthesisResultLight): string[] {
  if (!synthesis) return [];
  const fromBrief = synthesis.brief?.decisionsNeeded ?? [];
  const fromRecs = (synthesis.recommendations ?? []).flatMap(
    (r) => r.recommendedActions ?? []
  );
  const fromInsights = (synthesis.insights ?? []).flatMap((i) =>
    (i.recommendations ?? []).flatMap((r) => r.recommendedActions ?? [])
  );
  const merged = [...fromBrief, ...fromRecs, ...fromInsights];
  return [...new Set(merged.filter(Boolean))];
}
