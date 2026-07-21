import type {
  RiskCard,
  SynthesisResultLight,
  SynthesisRiskLight,
} from "@/lib/platform/intelligence/briefing/types";
import { cardActions } from "@/lib/platform/intelligence/briefing/cards/actions";
import {
  computePriorityScore,
  sortByPriority,
} from "@/lib/platform/intelligence/briefing/cards/priority";

export function buildRiskCards(
  synthesis: SynthesisResultLight | undefined,
  createId: (prefix: string) => string,
  limit = 5
): RiskCard[] {
  const risks = collectRisks(synthesis);
  const cards: RiskCard[] = risks.map((risk, i) => {
    const severity = risk.severity ?? 60;
    const urgency = risk.urgency ?? 55;
    const confidence = Math.round((risk.confidence ?? 0.6) * (risk.confidence != null && risk.confidence <= 1 ? 100 : 1));
    const businessImpact = Math.round((severity + urgency) / 2);
    const strategicAlignment = 60;
    return {
      id: risk.id ?? createId(`risk-${i}`),
      kind: "risk" as const,
      title: risk.title ?? "Cross-domain risk",
      summary: risk.narrative ?? "Elevated risk detected across contributing domains.",
      priorityScore: computePriorityScore({
        severity,
        urgency,
        confidence,
        businessImpact,
        strategicAlignment,
      }),
      severity,
      urgency,
      confidence,
      businessImpact,
      strategicAlignment,
      domains: risk.domains ?? [],
      status: severity >= 75 ? "elevated" : severity >= 50 ? "new" : "watch",
      explainability: {
        why: `Surfaced because severity ${severity} and urgency ${urgency} exceed briefing thresholds.`,
        contributingDomains: risk.domains ?? [],
        confidence,
        supportingEvidence: (risk.domains ?? []).map((domain, di) => ({
          id: createId(`risk-ev-${i}-${di}`),
          domain,
          statement: risk.narrative ?? `${domain} contributed to this risk cluster`,
          weight: 0.7,
          supporting: true,
        })),
      },
      actions: cardActions("risk"),
    };
  });

  return sortByPriority(cards).slice(0, limit);
}

function collectRisks(synthesis?: SynthesisResultLight): SynthesisRiskLight[] {
  if (!synthesis) return [];
  const fromBrief = synthesis.brief?.topRisks ?? [];
  const fromRoot = synthesis.risks ?? [];
  const fromInsights = (synthesis.insights ?? []).flatMap((i) => i.risks ?? []);
  const merged = [...fromBrief, ...fromRoot, ...fromInsights];
  const seen = new Set<string>();
  return merged.filter((r) => {
    const key = r.id ?? r.title ?? JSON.stringify(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
