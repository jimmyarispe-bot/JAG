/**
 * Strategic Intelligence — recommendations.
 *
 * Generates prioritized, urgent recommended actions with expected impact.
 */

import type {
  StrategicAnalysisResult,
  StrategicGoal,
  StrategicOpportunity,
  StrategicRecommendation,
  StrategicUrgency,
} from "@/lib/platform/intelligence/domains/strategic/types";
import type {
  IntelligenceCasePriority,
  IntelligenceConfidenceScore,
} from "@/lib/platform/intelligence/types";

/** Options for recommendation generation. */
export interface StrategicRecommendationsOptions {
  maxRecommendations?: number;
}

/**
 * Builds strategic recommendations from opportunities and goals.
 */
export class StrategicRecommendations {
  private readonly maxRecommendations: number;

  constructor(options: StrategicRecommendationsOptions = {}) {
    this.maxRecommendations = options.maxRecommendations ?? 5;
  }

  /**
   * Generate recommendations for the analyzed strategic opportunities.
   */
  generate(
    analysis: StrategicAnalysisResult,
    goals: readonly StrategicGoal[]
  ): StrategicRecommendation[] {
    const goalByOpportunity = new Map<string, StrategicGoal>();
    for (const goal of goals) {
      for (const opportunityId of goal.linkedOpportunities) {
        if (!goalByOpportunity.has(opportunityId)) {
          goalByOpportunity.set(opportunityId, goal);
        }
      }
    }

    const recommendations = analysis.opportunities
      .slice(0, this.maxRecommendations)
      .map((opportunity, index) =>
        this.fromOpportunity(opportunity, goalByOpportunity.get(opportunity.opportunityId), index)
      );

    return recommendations;
  }

  /**
   * Create an explicit recommendation.
   */
  create(input: {
    recommendationId: string;
    priority: IntelligenceCasePriority;
    urgency: StrategicUrgency;
    expectedImpact: string;
    recommendedActions: string[];
    confidence: IntelligenceConfidenceScore;
    linkedGoalId?: string;
    linkedOpportunityId?: string;
  }): StrategicRecommendation {
    return {
      recommendationId: input.recommendationId,
      priority: input.priority,
      urgency: input.urgency,
      expectedImpact: input.expectedImpact,
      recommendedActions: [...input.recommendedActions],
      confidence: input.confidence,
      linkedGoalId: input.linkedGoalId,
      linkedOpportunityId: input.linkedOpportunityId,
    };
  }

  private fromOpportunity(
    opportunity: StrategicOpportunity,
    goal: StrategicGoal | undefined,
    index: number
  ): StrategicRecommendation {
    const urgency = urgencyFor(opportunity.priority);
    const actions = actionsFor(opportunity);

    return {
      recommendationId: `${opportunity.opportunityId}:recommendation:${index}`,
      priority: opportunity.priority,
      urgency,
      expectedImpact: goal?.expectedValue ?? `Mitigate ${opportunity.kind.replace(/_/g, " ")}`,
      recommendedActions: actions,
      confidence: opportunity.confidence,
      linkedGoalId: goal?.id,
      linkedOpportunityId: opportunity.opportunityId,
    };
  }
}

function urgencyFor(priority: StrategicOpportunity["priority"]): StrategicUrgency {
  switch (priority) {
    case "critical":
      return "immediate";
    case "high":
      return "near_term";
    case "medium":
      return "planned";
    case "low":
      return "watch";
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

function actionsFor(opportunity: StrategicOpportunity): string[] {
  switch (opportunity.kind) {
    case "financial_weakness":
      return [
        "Stand up a cash/collections war room",
        "Tighten billing SLAs and escalation paths",
        "Publish a 30-day finance recovery plan",
      ];
    case "growth_opportunity":
      return [
        "Prioritize highest-converting enrollment channels",
        "Fund a time-boxed recruiting sprint",
        "Align campus capacity with projected demand",
      ];
    case "staffing_issue":
      return [
        "Launch targeted hiring for critical vacancies",
        "Deploy stay interviews for at-risk roles",
        "Rebalance workloads across campuses",
      ];
    case "compliance_risk":
      return [
        "Close open high/critical compliance findings",
        "Assign owners and due dates for each finding",
        "Schedule independent verification review",
      ];
    case "customer_experience_issue":
      return [
        "Map top family friction points",
        "Pilot a rapid-response family success desk",
        "Measure satisfaction weekly during remediation",
      ];
    case "mission_opportunity":
      return [
        "Define mission outcome targets for the next quarter",
        "Resource the highest-leverage program expansion",
        "Report mission progress to board sponsors",
      ];
    case "operational_weakness":
      return [
        "Identify the bottleneck process and owners",
        "Run a 2-week process improvement cycle",
        "Instrument cycle-time metrics for visibility",
      ];
    case "organizational_risk":
      return [
        "Escalate risk to executive sponsors",
        "Document mitigation owners and checkpoints",
        "Brief the board on residual risk posture",
      ];
    default: {
      const _exhaustive: never = opportunity.kind;
      return _exhaustive;
    }
  }
}
