/**
 * Strategic Intelligence — impact.
 *
 * Measures multi-dimensional strategic impact.
 */

import type {
  StrategicGoal,
  StrategicImpactAssessment,
  StrategicImpactDimension,
  StrategicImpactScore,
  StrategicOpportunity,
  StrategicRecommendation,
} from "@/lib/platform/intelligence/domains/strategic/types";
import { STRATEGIC_IMPACT_DIMENSIONS } from "@/lib/platform/intelligence/domains/strategic/types";

/** Options for impact calculation. */
export interface StrategicImpactOptions {
  /** Minimum score to include a dimension as primary. */
  primaryThreshold?: number;
}

/**
 * Calculates financial, operational, academic, mission, and related impact scores.
 */
export class StrategicImpact {
  private readonly primaryThreshold: number;

  constructor(options: StrategicImpactOptions = {}) {
    this.primaryThreshold = options.primaryThreshold ?? 0.55;
  }

  /**
   * Assess impact across all strategic dimensions.
   */
  assess(
    opportunities: readonly StrategicOpportunity[],
    goals: readonly StrategicGoal[],
    recommendations: readonly StrategicRecommendation[] = []
  ): StrategicImpactAssessment {
    const scores = STRATEGIC_IMPACT_DIMENSIONS.map((dimension) =>
      this.scoreDimension(dimension, opportunities, goals, recommendations)
    );

    const overallScore =
      scores.length === 0
        ? 0
        : Number(
            (
              scores.reduce((sum, item) => sum + item.score, 0) / scores.length
            ).toFixed(4)
          );

    const primaryDimensions = scores
      .filter((item) => item.score >= this.primaryThreshold)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.dimension);

    const summary =
      primaryDimensions.length > 0
        ? `Primary impact dimensions: ${primaryDimensions.join(", ")} (overall ${overallScore}).`
        : `Diffuse impact across dimensions (overall ${overallScore}).`;

    return {
      scores,
      overallScore,
      primaryDimensions,
      summary,
    };
  }

  /**
   * Score a single impact dimension.
   */
  scoreDimension(
    dimension: StrategicImpactDimension,
    opportunities: readonly StrategicOpportunity[],
    goals: readonly StrategicGoal[],
    recommendations: readonly StrategicRecommendation[] = []
  ): StrategicImpactScore {
    let score = 0.15;
    const rationales: string[] = [];

    for (const opportunity of opportunities) {
      const weight = dimensionWeight(dimension, opportunity.kind);
      if (weight <= 0) continue;
      const contribution =
        weight *
        (0.5 + opportunity.confidence.value * 0.5) *
        priorityMultiplier(opportunity.priority);
      score += contribution;
      rationales.push(`${opportunity.kind} → +${contribution.toFixed(2)}`);
    }

    if (goals.some((g) => g.priority === "critical" || g.priority === "high")) {
      score += 0.05;
      rationales.push("High-priority goals present");
    }

    if (recommendations.some((r) => r.urgency === "immediate")) {
      score += 0.05;
      rationales.push("Immediate recommendations present");
    }

    score = Math.max(0, Math.min(1, Number(score.toFixed(4))));

    return {
      dimension,
      score,
      rationale:
        rationales.length > 0
          ? rationales.slice(0, 4).join("; ")
          : "No strong signals for this dimension",
    };
  }
}

function priorityMultiplier(priority: StrategicOpportunity["priority"]): number {
  switch (priority) {
    case "critical":
      return 1.25;
    case "high":
      return 1.1;
    case "medium":
      return 1;
    case "low":
      return 0.8;
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

function dimensionWeight(
  dimension: StrategicImpactDimension,
  kind: StrategicOpportunity["kind"]
): number {
  const matrix: Record<StrategicOpportunity["kind"], Partial<Record<StrategicImpactDimension, number>>> = {
    financial_weakness: { financial: 0.45, operational: 0.15, compliance: 0.1 },
    growth_opportunity: { financial: 0.25, customer: 0.2, community: 0.15, academic: 0.1 },
    mission_opportunity: { mission: 0.45, community: 0.2, academic: 0.15 },
    operational_weakness: { operational: 0.45, employee: 0.15, customer: 0.1 },
    compliance_risk: { compliance: 0.5, operational: 0.1, mission: 0.1 },
    staffing_issue: { employee: 0.45, academic: 0.2, operational: 0.15 },
    customer_experience_issue: { customer: 0.45, community: 0.15, mission: 0.1 },
    organizational_risk: { mission: 0.2, compliance: 0.2, operational: 0.15, financial: 0.1 },
  };

  return matrix[kind][dimension] ?? 0;
}
