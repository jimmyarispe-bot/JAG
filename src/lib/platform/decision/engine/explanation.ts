import type {
  AppliedRule,
  CollectedEvidence,
  DecisionDefinition,
  DecisionExplanation,
  Recommendation,
  ScoringResult,
} from "@/lib/platform/decision/types";

export interface BuildExplanationInput {
  definition: DecisionDefinition;
  recommendation: Recommendation;
  scoring: ScoringResult;
  evidence: CollectedEvidence;
  rulesApplied: AppliedRule[];
  aiReasoning?: string[];
}

/** Build a structured explanation from decision execution artifacts. */
export function buildDecisionExplanation(input: BuildExplanationInput): DecisionExplanation {
  const matchedRules = input.rulesApplied.filter((rule) => rule.matched);
  const rulesSummary = matchedRules.map(
    (rule) => `${rule.label}${rule.outcomeKey ? ` → ${rule.outcomeKey}` : ""}`
  );

  const evidenceSummary = input.evidence.items.map(
    (item) => `${item.label ?? item.key}: ${String(item.value)}`
  );

  const keyFactors: string[] = [];
  if (matchedRules.length > 0) {
    keyFactors.push(`${matchedRules.length} rule(s) matched`);
  }
  if (input.evidence.completeness < 1) {
    keyFactors.push(`Evidence ${Math.round(input.evidence.completeness * 100)}% complete`);
  }
  if (input.aiReasoning?.length) {
    keyFactors.push("AI-assisted scoring applied");
  }

  const caveats: string[] = [];
  if (input.evidence.missingRequired.length > 0) {
    caveats.push(`Missing required evidence: ${input.evidence.missingRequired.join(", ")}`);
  }
  if (input.scoring.rankedOutcomes.length > 1) {
    const top = input.scoring.rankedOutcomes[0];
    const second = input.scoring.rankedOutcomes[1];
    if (top && second && top.score - second.score < 10) {
      caveats.push("Top outcomes are closely scored — review alternatives");
    }
  }

  return {
    summary: `Recommended "${input.recommendation.label}" for ${input.definition.name}`,
    whatHappened: `Evaluated ${input.rulesApplied.length} rules against ${input.evidence.items.length} evidence items`,
    whyItMatters: input.recommendation.description ?? input.definition.description,
    keyFactors,
    rulesSummary,
    evidenceSummary,
    caveats: caveats.length > 0 ? caveats : undefined,
  };
}
