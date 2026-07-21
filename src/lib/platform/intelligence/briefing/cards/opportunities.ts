import type {
  OpportunityCard,
  SynthesisOpportunityLight,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/briefing/types";
import { cardActions } from "@/lib/platform/intelligence/briefing/cards/actions";
import {
  computePriorityScore,
  sortByPriority,
} from "@/lib/platform/intelligence/briefing/cards/priority";

const CATEGORY_MAP: Record<string, OpportunityCard["category"]> = {
  revenue: "revenue",
  funding: "grant",
  operational_efficiency: "operational",
  staffing: "hiring",
  automation: "automation",
  cost_savings: "cost_reduction",
  partnership: "expansion",
  growth: "growth",
};

export function buildOpportunityCards(
  synthesis: SynthesisResultLight | undefined,
  createId: (prefix: string) => string,
  limit = 5
): OpportunityCard[] {
  const opps = collectOpportunities(synthesis);
  const cards: OpportunityCard[] = opps.map((opp, i) => {
    const estimatedImpact = opp.estimatedImpact ?? 55;
    const confidence = Math.round(
      (opp.confidence ?? 0.55) * (opp.confidence != null && opp.confidence <= 1 ? 100 : 1)
    );
    const severity = Math.max(0, 100 - estimatedImpact);
    const urgency = Math.round(estimatedImpact * 0.7);
    const businessImpact = estimatedImpact;
    const strategicAlignment = 65;
    const category = CATEGORY_MAP[opp.category ?? "growth"] ?? "growth";

    return {
      id: opp.id ?? createId(`opp-${i}`),
      kind: "opportunity" as const,
      title: opp.title ?? "Growth opportunity",
      summary: opp.narrative ?? "Cross-domain opportunity detected.",
      category,
      estimatedImpact,
      priorityScore: computePriorityScore({
        severity: estimatedImpact,
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
      domains: opp.domains ?? [],
      explainability: {
        why: `Surfaced as a ${category} opportunity with estimated impact ${estimatedImpact}.`,
        contributingDomains: opp.domains ?? [],
        confidence,
        supportingEvidence: (opp.domains ?? []).map((domain, di) => ({
          id: createId(`opp-ev-${i}-${di}`),
          domain,
          statement: opp.narrative ?? `${domain} supports this opportunity`,
          weight: 0.65,
          supporting: true,
        })),
      },
      actions: cardActions("opportunity"),
    };
  });

  return sortByPriority(cards).slice(0, limit);
}

function collectOpportunities(synthesis?: SynthesisResultLight): SynthesisOpportunityLight[] {
  if (!synthesis) return [];
  const fromBrief = synthesis.brief?.topOpportunities ?? [];
  const fromRoot = synthesis.opportunities ?? [];
  const fromInsights = (synthesis.insights ?? []).flatMap((i) => i.opportunities ?? []);
  const merged = [...fromBrief, ...fromRoot, ...fromInsights];
  const seen = new Set<string>();
  return merged.filter((o) => {
    const key = o.id ?? o.title ?? JSON.stringify(o);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
