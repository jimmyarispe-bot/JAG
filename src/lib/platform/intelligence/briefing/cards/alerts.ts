import type { AlertCard, SynthesisResultLight } from "@/lib/platform/intelligence/briefing/types";
import { cardActions } from "@/lib/platform/intelligence/briefing/cards/actions";
import {
  computePriorityScore,
  scoresFromLight,
  sortByPriority,
} from "@/lib/platform/intelligence/briefing/cards/priority";

export function buildAlertCards(
  synthesis: SynthesisResultLight | undefined,
  createId: (prefix: string) => string,
  limit = 5
): AlertCard[] {
  const alerts = collectAlerts(synthesis);
  const scores = scoresFromLight(synthesis?.insights?.[0]?.scores);
  const domains = synthesis?.contributingDomains ?? [];

  const cards: AlertCard[] = alerts.map((alert, i) => {
    const alertLevel =
      scores.severity >= 85 || scores.urgency >= 85
        ? "critical"
        : scores.severity >= 70
          ? "high"
          : scores.severity >= 50
            ? "medium"
            : "low";
    const severity =
      alertLevel === "critical" ? 90 : alertLevel === "high" ? 75 : alertLevel === "medium" ? 55 : 35;

    return {
      id: createId(`alert-${i}`),
      kind: "alert" as const,
      title: alert,
      summary: alert,
      alertLevel,
      priorityScore: computePriorityScore({
        severity,
        urgency: scores.urgency,
        confidence: scores.confidence,
        businessImpact: scores.businessImpact,
        strategicAlignment: scores.strategicAlignment,
      }),
      severity,
      urgency: scores.urgency,
      confidence: scores.confidence,
      businessImpact: scores.businessImpact,
      strategicAlignment: scores.strategicAlignment,
      domains,
      explainability: {
        why: `Critical alert promoted from synthesis: ${alert}`,
        contributingDomains: domains,
        confidence: scores.confidence,
        supportingEvidence: [
          {
            id: createId(`alert-ev-${i}`),
            domain: domains[0] ?? "synthesis",
            statement: alert,
            weight: 0.8,
            supporting: true,
          },
        ],
      },
      actions: cardActions("alert"),
    };
  });

  return sortByPriority(cards).slice(0, limit);
}

function collectAlerts(synthesis?: SynthesisResultLight): string[] {
  if (!synthesis) return [];
  const fromBrief = synthesis.brief?.criticalAlerts ?? [];
  const highRisks = (synthesis.brief?.topRisks ?? [])
    .filter((r) => (r.severity ?? 0) >= 70)
    .map((r) => r.title ?? "Elevated risk");
  return [...new Set([...fromBrief, ...highRisks].filter(Boolean))];
}
