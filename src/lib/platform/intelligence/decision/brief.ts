/**
 * Decision Intelligence — executive brief.
 */

import type {
  DecisionAlternativesResult,
  DecisionAnalysisResult,
  DecisionApproval,
  DecisionBrief,
  DecisionEvidenceResult,
  DecisionImpactAssessment,
  DecisionRecommendation,
  DecisionRequest,
  DecisionRisksResult,
  DecisionScenariosResult,
  DecisionTimeline,
} from "@/lib/platform/intelligence/decision/types";

/** Options for brief generation. */
export interface DecisionBriefOptions {
  now?: () => Date;
}

/**
 * Generates the executive decision narrative.
 */
export class DecisionBriefBuilder {
  private readonly now: () => Date;

  constructor(options: DecisionBriefOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  generate(input: {
    request: DecisionRequest;
    analysis: DecisionAnalysisResult;
    evidence: DecisionEvidenceResult;
    alternatives: DecisionAlternativesResult;
    recommendation: DecisionRecommendation;
    risks: DecisionRisksResult;
    scenarios: DecisionScenariosResult;
    impact: DecisionImpactAssessment;
    approval: DecisionApproval;
    timeline: DecisionTimeline;
  }): DecisionBrief {
    const evidence = input.evidence.items.map((i) => `${i.kind}: ${i.title} — ${i.summary}`);
    const alternatives = input.alternatives.alternatives.map(
      (a) => `${a.title} (score ${a.score}): ${a.expectedImpact}`
    );
    const risks = input.risks.risks.map(
      (r) => `${r.category}: ${r.title} [${r.severity}]`
    );
    const expectedOutcomes = input.scenarios.scenarios.map(
      (s) => `${s.title}: ${s.narrative}`
    );

    const decisionSummary = `${input.analysis.summary} Recommended: ${input.recommendation.recommendedOption}.`;
    const recommendation = `${input.recommendation.recommendedOption} — ${input.recommendation.expectedValue}`;
    const timeline = input.timeline.summary;

    const narrative = [
      `Decision Summary: ${decisionSummary}`,
      `Evidence: ${evidence.join("; ") || "None"}`,
      `Alternatives: ${alternatives.join("; ") || "None"}`,
      `Recommendation: ${recommendation}`,
      `Risks: ${risks.join("; ") || "None"}`,
      `Expected Outcomes: ${expectedOutcomes.join("; ") || "None"}`,
      `Approval Status: ${input.approval.status}`,
      `Timeline: ${timeline}`,
      `Confidence: ${input.recommendation.confidence.level} (${input.recommendation.confidence.value})`,
      `Impact: ${input.impact.summary}`,
    ].join("\n\n");

    return {
      briefId: `${input.request.requestId}:decision-brief`,
      requestId: input.request.requestId,
      decisionSummary,
      evidence,
      alternatives,
      recommendation,
      risks,
      expectedOutcomes,
      approvalStatus: input.approval.status,
      timeline,
      confidence: input.recommendation.confidence,
      narrative,
      createdAt: this.now().toISOString(),
      metadata: input.request.metadata,
    };
  }
}
