import type {
  AppliedRule,
  CollectedEvidence,
  ConfidenceFactor,
  ConfidenceLevel,
  ConfidenceScore,
} from "@/lib/platform/decision/types";

function resolveConfidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  return "low";
}

export interface ComputeConfidenceInput {
  evidence: CollectedEvidence;
  rulesApplied: AppliedRule[];
  scoreGap?: number;
  aiAdjustment?: number;
}

/** Derive confidence from evidence completeness, rule match clarity, and optional AI adjustment. */
export function computeDecisionConfidence(input: ComputeConfidenceInput): ConfidenceScore {
  const factors: ConfidenceFactor[] = [];

  const evidenceContribution = input.evidence.completeness * 0.4;
  factors.push({
    key: "evidence_completeness",
    label: "Evidence Completeness",
    contribution: evidenceContribution,
    reason:
      input.evidence.missingRequired.length > 0
        ? `Missing required evidence: ${input.evidence.missingRequired.join(", ")}`
        : "All required evidence collected",
  });

  const matchedRules = input.rulesApplied.filter((rule) => rule.matched);
  const matchRatio =
    input.rulesApplied.length > 0 ? matchedRules.length / input.rulesApplied.length : 0.5;
  const ruleContribution = matchRatio * 0.35;
  factors.push({
    key: "rule_match_clarity",
    label: "Rule Match Clarity",
    contribution: ruleContribution,
    reason: `${matchedRules.length} of ${input.rulesApplied.length} rules matched`,
  });

  const gap = input.scoreGap ?? 0;
  const gapContribution = Math.min(gap / 100, 1) * 0.15;
  factors.push({
    key: "outcome_separation",
    label: "Outcome Separation",
    contribution: gapContribution,
    reason: gap > 0 ? `Top outcome leads by ${gap.toFixed(1)} points` : "Outcomes closely scored",
  });

  const aiContribution = (input.aiAdjustment ?? 0) * 0.1;
  if (aiContribution !== 0) {
    factors.push({
      key: "ai_assist_adjustment",
      label: "AI Assist Adjustment",
      contribution: aiContribution,
      reason: "AI-assisted engine adjusted confidence",
    });
  }

  const rawValue = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  const value = Math.min(1, Math.max(0, rawValue));

  return {
    value,
    level: resolveConfidenceLevel(value),
    factors,
  };
}
