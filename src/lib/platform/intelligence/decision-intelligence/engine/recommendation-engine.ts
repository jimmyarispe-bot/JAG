import { buildExplainability } from "@/lib/platform/intelligence/decision-intelligence/explainability/explain";
import type {
  DecisionOption,
  DecisionRecommendation,
  DecisionScope,
  DecisionEvidence,
  DecisionIssueKind,
  DecisionApprovalLevel,
  PolicyFlag,
} from "@/lib/platform/intelligence/decision-intelligence/types";
import { DECISION_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/decision-intelligence/types";

export function rankOptions(options: DecisionOption[]): DecisionOption[] {
  const sorted = [...options].sort((a, b) => {
    if (b.scorecard.overall !== a.scorecard.overall) {
      return b.scorecard.overall - a.scorecard.overall;
    }
    // Tie-break: higher confidence, then lower risk, then lower effort
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (a.scorecard.risk !== b.scorecard.risk) return a.scorecard.risk - b.scorecard.risk;
    return a.scorecard.effort - b.scorecard.effort;
  });

  return sorted.map((opt, index) => ({
    ...opt,
    rank: index + 1,
    whyRanked:
      index === 0
        ? `Top-ranked: highest overall score (${opt.scorecard.overall}) with confidence ${opt.confidence}.`
        : `Ranked #${index + 1}: overall ${opt.scorecard.overall}; behind leader on impact/alignment/risk balance.`,
  }));
}

export function buildRecommendation(input: {
  scope: DecisionScope;
  issueKind: DecisionIssueKind;
  issueTitle: string;
  issueSummary: string;
  domains: string[];
  options: DecisionOption[];
  evidence: DecisionEvidence[];
  createId: (prefix: string) => string;
  nowIso: string;
}): DecisionRecommendation {
  const ranked = rankOptions(input.options);
  const recommended = ranked[0] ?? null;
  const explainability = buildExplainability({
    recommended,
    options: ranked,
    domains: input.domains,
    evidence: input.evidence,
  });

  const policyFlags = mergeFlags(ranked);
  const approvalRequired = maxApproval(
    ranked.map((o) => o.approvalRequired),
    recommended?.approvalRequired ?? "none"
  );

  return {
    id: input.createId("rec"),
    version: DECISION_INTELLIGENCE_VERSION,
    generatedAt: input.nowIso,
    scope: input.scope,
    issue: {
      kind: input.issueKind,
      title: input.issueTitle,
      summary: input.issueSummary,
      domains: input.domains,
    },
    executiveSummary: recommended
      ? `Recommend "${recommended.title}" for ${input.issueTitle}. ${recommended.summary} Overall ${recommended.scorecard.overall}/100 (confidence ${recommended.confidence}).`
      : `No actionable options generated for ${input.issueTitle}.`,
    rankedOptions: ranked,
    recommendedOptionId: recommended?.id ?? null,
    evidence: input.evidence,
    benefits: recommended?.benefits ?? [],
    risks: recommended?.risks ?? [],
    assumptions: recommended?.assumptions ?? [],
    dependencies: recommended?.dependencies ?? [],
    estimatedEffort: recommended?.estimatedEffort ?? "medium",
    confidence: recommended?.confidence ?? 0,
    suggestedNextStep: recommended
      ? recommended.approvalRequired !== "none"
        ? `Route "${recommended.title}" for ${recommended.approvalRequired} approval, then assign an owner.`
        : `Assign an owner and open an investigation / initiative for "${recommended.title}".`
      : "Gather additional domain evidence and re-run Decision Intelligence.",
    explainability,
    policyFlags,
    approvalRequired,
    metadata: {
      optionCount: ranked.length,
      recommends: recommended?.title,
    },
  };
}

function mergeFlags(options: DecisionOption[]): PolicyFlag[] {
  const seen = new Set<string>();
  const out: PolicyFlag[] = [];
  for (const opt of options) {
    for (const flag of opt.policyFlags) {
      if (seen.has(flag.id)) continue;
      seen.add(flag.id);
      out.push(flag);
    }
  }
  return out;
}

function maxApproval(
  levels: DecisionApprovalLevel[],
  fallback: DecisionApprovalLevel
): DecisionApprovalLevel {
  const rank = { none: 0, manager: 1, executive: 2, board: 3 } as const;
  let best = fallback;
  for (const level of levels) {
    if (rank[level] > rank[best]) best = level;
  }
  return best;
}
