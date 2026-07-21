import type {
  DecisionEvidence,
  DecisionExplainability,
  DecisionOption,
} from "@/lib/platform/intelligence/decision-intelligence/types";

export function buildExplainability(input: {
  recommended: DecisionOption | null;
  options: DecisionOption[];
  domains: string[];
  evidence: DecisionEvidence[];
}): DecisionExplainability {
  const recommended = input.recommended;
  const contradictory = input.evidence.filter((e) => !e.supporting);
  const historicalInfluence =
    recommended?.historical.lessons.map((l) => l.title) ??
    recommended?.historical.similarDecisions.map((d) => d.title) ??
    [];

  return {
    why: recommended
      ? `"${recommended.title}" ranks #${recommended.rank} with overall score ${recommended.scorecard.overall}/100 because it balances expected impact (${recommended.scorecard.expectedImpact}), strategic alignment (${recommended.scorecard.strategicAlignment}), and confidence (${recommended.confidence}) against risk (${recommended.scorecard.risk}) and effort (${recommended.scorecard.effort}).`
      : "No recommendation could be formed from the available intelligence.",
    contributingDomains: input.domains,
    historicalInfluence,
    keyAssumptions: recommended?.assumptions ?? [],
    contradictoryEvidence: contradictory,
    confidence: recommended?.confidence ?? 0,
  };
}
