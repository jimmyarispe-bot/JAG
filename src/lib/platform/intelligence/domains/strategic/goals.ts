/**
 * Strategic Intelligence — goals.
 *
 * Creates strategic goals from analyzed opportunities.
 */

import type {
  StrategicAnalysisResult,
  StrategicGoal,
  StrategicGoalPriority,
  StrategicGoalStatus,
  StrategicOpportunity,
} from "@/lib/platform/intelligence/domains/strategic/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

/** Dependencies / options for goal creation. */
export interface StrategicGoalsOptions {
  defaultStatus?: StrategicGoalStatus;
  /** Days from createdDate to targetDate. */
  defaultHorizonDays?: number;
  now?: () => Date;
  createId?: (opportunity: StrategicOpportunity, index: number) => string;
}

/**
 * Builds strategic goals linked to opportunities.
 */
export class StrategicGoals {
  private readonly defaultStatus: StrategicGoalStatus;
  private readonly defaultHorizonDays: number;
  private readonly now: () => Date;
  private readonly createId: (opportunity: StrategicOpportunity, index: number) => string;

  constructor(options: StrategicGoalsOptions = {}) {
    this.defaultStatus = options.defaultStatus ?? "proposed";
    this.defaultHorizonDays = options.defaultHorizonDays ?? 90;
    this.now = options.now ?? (() => new Date());
    this.createId =
      options.createId ??
      ((opportunity, index) => `${opportunity.opportunityId}:goal:${index}`);
  }

  /**
   * Create one strategic goal per opportunity (primary first).
   */
  createFromAnalysis(analysis: StrategicAnalysisResult): StrategicGoal[] {
    return analysis.opportunities.map((opportunity, index) =>
      this.createFromOpportunity(opportunity, index)
    );
  }

  /**
   * Create a single goal from an opportunity.
   */
  createFromOpportunity(
    opportunity: StrategicOpportunity,
    index = 0
  ): StrategicGoal {
    const createdDate = this.now().toISOString();
    const target = new Date(this.now().getTime());
    target.setUTCDate(target.getUTCDate() + this.defaultHorizonDays);

    return {
      id: this.createId(opportunity, index),
      title: this.titleFor(opportunity),
      description: this.descriptionFor(opportunity),
      priority: opportunity.priority,
      status: this.defaultStatus,
      createdDate,
      targetDate: target.toISOString(),
      expectedValue: this.expectedValueFor(opportunity),
      confidence: opportunity.confidence,
      linkedOpportunities: [opportunity.opportunityId],
    };
  }

  /**
   * Create a goal from explicit fields (tests / advanced callers).
   */
  create(input: {
    id: string;
    title: string;
    description: string;
    priority: StrategicGoalPriority;
    status?: StrategicGoalStatus;
    createdDate?: string;
    targetDate: string;
    expectedValue: string;
    confidence: IntelligenceConfidenceScore;
    linkedOpportunities: string[];
  }): StrategicGoal {
    return {
      id: input.id,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status ?? this.defaultStatus,
      createdDate: input.createdDate ?? this.now().toISOString(),
      targetDate: input.targetDate,
      expectedValue: input.expectedValue,
      confidence: input.confidence,
      linkedOpportunities: [...input.linkedOpportunities],
    };
  }

  private titleFor(opportunity: StrategicOpportunity): string {
    return `Strategic goal: ${opportunity.title}`;
  }

  private descriptionFor(opportunity: StrategicOpportunity): string {
    return `Address ${opportunity.kind.replace(/_/g, " ")} — ${opportunity.description}`;
  }

  private expectedValueFor(opportunity: StrategicOpportunity): string {
    switch (opportunity.kind) {
      case "growth_opportunity":
        return "Measurable growth in enrollment or market reach";
      case "financial_weakness":
        return "Improved financial resilience and cash position";
      case "mission_opportunity":
        return "Stronger mission delivery and community outcomes";
      case "compliance_risk":
        return "Reduced compliance exposure and audit risk";
      case "staffing_issue":
        return "Stabilized staffing capacity and retention";
      case "customer_experience_issue":
        return "Higher family/customer satisfaction";
      case "operational_weakness":
        return "Improved operational throughput and reliability";
      case "organizational_risk":
        return "Reduced organizational risk exposure";
      default: {
        const _exhaustive: never = opportunity.kind;
        return _exhaustive;
      }
    }
  }
}
