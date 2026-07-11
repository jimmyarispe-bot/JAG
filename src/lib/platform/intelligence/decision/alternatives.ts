/**
 * Decision Intelligence — alternatives.
 */

import type {
  DecisionAlternative,
  DecisionAlternativesResult,
  DecisionAnalysisResult,
  DecisionEvidenceResult,
  DecisionRequest,
} from "@/lib/platform/intelligence/decision/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

/** Options for alternative generation. */
export interface DecisionAlternativesOptions {
  maxAlternatives?: number;
}

/**
 * Generates multiple decision options with benefits, costs, and impact.
 */
export class DecisionAlternatives {
  private readonly maxAlternatives: number;

  constructor(options: DecisionAlternativesOptions = {}) {
    this.maxAlternatives = options.maxAlternatives ?? 3;
  }

  generate(
    request: DecisionRequest,
    analysis: DecisionAnalysisResult,
    evidence: DecisionEvidenceResult
  ): DecisionAlternativesResult {
    const templates = this.templatesFor(request, analysis);
    const alternatives = templates.slice(0, this.maxAlternatives).map((template, index) => {
      const confidence = this.confidenceFor(evidence, index);
      const score = Number(
        (
          confidence.value * 0.5 +
          (template.benefits.length - template.drawbacks.length) * 0.05 +
          (3 - index) * 0.1
        ).toFixed(4)
      );
      const alternative: DecisionAlternative = {
        alternativeId: `${request.requestId}:alt:${index}`,
        title: template.title,
        description: template.description,
        benefits: template.benefits,
        drawbacks: template.drawbacks,
        cost: template.cost,
        timelineDays: template.timelineDays,
        confidence,
        expectedImpact: template.expectedImpact,
        score: Math.max(0, Math.min(1, score)),
      };
      return alternative;
    });

    const ranked = [...alternatives].sort((a, b) => b.score - a.score);

    return {
      requestId: request.requestId,
      alternatives: ranked,
      summary: `Generated ${ranked.length} alternative(s); top option "${ranked[0]?.title ?? "none"}".`,
      metadata: request.metadata,
    };
  }

  private templatesFor(
    request: DecisionRequest,
    analysis: DecisionAnalysisResult
  ): Array<{
    title: string;
    description: string;
    benefits: string[];
    drawbacks: string[];
    cost: DecisionAlternative["cost"];
    timelineDays: number;
    expectedImpact: string;
  }> {
    const subject = request.subject;
    const aggressiveBudget =
      analysis.priority === "critical" || analysis.priority === "high" ? 75000 : 40000;

    return [
      {
        title: `Act now: ${subject}`,
        description: `Immediate decisive action on "${subject}" using current strategic and execution signals.`,
        benefits: [
          "Captures urgency while evidence is fresh",
          "Aligns with active strategic goals",
          "Creates clear ownership and timeline",
        ],
        drawbacks: [
          "Higher near-term resource commitment",
          "Less time for extended stakeholder consultation",
        ],
        cost: {
          amount: aggressiveBudget,
          currency: "USD",
          notes: "Includes implementation sprint capacity",
        },
        timelineDays: analysis.priority === "critical" ? 30 : 60,
        expectedImpact: "Faster risk reduction and earlier realization of expected value",
      },
      {
        title: `Phased approach: ${subject}`,
        description: `Stage the decision with a pilot, review gate, then scale.`,
        benefits: [
          "Limits downside through gated investment",
          "Builds evidence during pilot phase",
          "Easier approval path for board/ELT",
        ],
        drawbacks: [
          "Slower full realization",
          "Pilot overhead and dual operating modes",
        ],
        cost: {
          amount: Math.round(aggressiveBudget * 0.55),
          currency: "USD",
          notes: "Pilot funding with optional scale-up",
        },
        timelineDays: 90,
        expectedImpact: "Balanced risk/reward with measurable pilot learning",
      },
      {
        title: `Defer and monitor: ${subject}`,
        description: `Hold the decision, strengthen evidence, and revisit on a fixed cadence.`,
        benefits: [
          "Preserves optionality",
          "Avoids premature spend",
          "Allows KPI and execution trends to mature",
        ],
        drawbacks: [
          "Risk may compound while waiting",
          "Opportunity cost if competitors/markets move",
        ],
        cost: {
          amount: Math.round(aggressiveBudget * 0.15),
          currency: "USD",
          notes: "Monitoring and analysis only",
        },
        timelineDays: 120,
        expectedImpact: "Lower spend with delayed or reduced outcome realization",
      },
    ];
  }

  private confidenceFor(
    evidence: DecisionEvidenceResult,
    index: number
  ): IntelligenceConfidenceScore {
    const base =
      evidence.items.reduce((sum, item) => sum + item.weight, 0) /
      Math.max(1, evidence.items.length);
    const value = Math.min(1, Number((base - index * 0.05).toFixed(4)));
    return {
      value: Math.max(0.2, value),
      level: value >= 0.75 ? "high" : value >= 0.45 ? "medium" : "low",
      factors: [
        {
          key: "evidence_support",
          label: "Evidence Support",
          contribution: base,
        },
      ],
    };
  }
}
