/**
 * Strategic Intelligence — objectives.
 *
 * Creates measurable objectives linked to strategic goals.
 */

import type {
  StrategicGoal,
  StrategicMeasurementFrequency,
  StrategicObjective,
  StrategicOpportunity,
  StrategicOpportunityKind,
} from "@/lib/platform/intelligence/domains/strategic/types";

/** Options for objective generation. */
export interface StrategicObjectivesOptions {
  createId?: (goal: StrategicGoal, index: number) => string;
}

/**
 * Builds measurable objectives for strategic goals.
 */
export class StrategicObjectives {
  private readonly createId: (goal: StrategicGoal, index: number) => string;

  constructor(options: StrategicObjectivesOptions = {}) {
    this.createId =
      options.createId ?? ((goal, index) => `${goal.id}:objective:${index}`);
  }

  /**
   * Create default measurable objectives for each goal.
   */
  createForGoals(
    goals: readonly StrategicGoal[],
    opportunities: readonly StrategicOpportunity[] = []
  ): StrategicObjective[] {
    const byOpportunity = new Map(
      opportunities.map((o) => [o.opportunityId, o] as const)
    );
    const objectives: StrategicObjective[] = [];

    for (const goal of goals) {
      const linked = goal.linkedOpportunities
        .map((id) => byOpportunity.get(id))
        .filter((o): o is StrategicOpportunity => o !== undefined);
      const kind = linked[0]?.kind;
      objectives.push(this.createForGoal(goal, kind, 0));
      if (kind === "financial_weakness" || kind === "growth_opportunity") {
        objectives.push(this.createForGoal(goal, kind, 1));
      }
    }

    return objectives;
  }

  /**
   * Create a single objective with explicit metrics.
   */
  create(input: {
    id: string;
    goalId: string;
    title: string;
    description: string;
    baseline: number;
    target: number;
    currentValue: number;
    measurementMethod: string;
    frequency: StrategicMeasurementFrequency;
    successCriteria: string;
  }): StrategicObjective {
    return {
      id: input.id,
      goalId: input.goalId,
      title: input.title,
      description: input.description,
      baseline: input.baseline,
      target: input.target,
      currentValue: input.currentValue,
      measurementMethod: input.measurementMethod,
      frequency: input.frequency,
      successCriteria: input.successCriteria,
    };
  }

  private createForGoal(
    goal: StrategicGoal,
    kind: StrategicOpportunityKind | undefined,
    index: number
  ): StrategicObjective {
    const template = metricTemplate(kind, index);
    return {
      id: this.createId(goal, index),
      goalId: goal.id,
      title: template.title,
      description: `${template.title} for goal "${goal.title}"`,
      baseline: template.baseline,
      target: template.target,
      currentValue: template.baseline,
      measurementMethod: template.measurementMethod,
      frequency: template.frequency,
      successCriteria: template.successCriteria,
    };
  }
}

function metricTemplate(
  kind: StrategicOpportunityKind | undefined,
  index: number
): {
  title: string;
  baseline: number;
  target: number;
  measurementMethod: string;
  frequency: StrategicMeasurementFrequency;
  successCriteria: string;
} {
  switch (kind) {
    case "financial_weakness":
      return index === 0
        ? {
            title: "Days of cash on hand",
            baseline: 45,
            target: 75,
            measurementMethod: "Finance ledger cash / average daily burn",
            frequency: "monthly",
            successCriteria: "Sustain at least 75 days cash for two consecutive months",
          }
        : {
            title: "Collection rate",
            baseline: 88,
            target: 95,
            measurementMethod: "Collected tuition / billed tuition",
            frequency: "monthly",
            successCriteria: "Reach 95% collection rate within the goal horizon",
          };
    case "growth_opportunity":
      return index === 0
        ? {
            title: "Net enrollment change",
            baseline: 0,
            target: 25,
            measurementMethod: "SIS enrolled students delta vs baseline cohort",
            frequency: "monthly",
            successCriteria: "Net +25 enrolled students vs baseline",
          }
        : {
            title: "Inquiry-to-enroll conversion",
            baseline: 18,
            target: 28,
            measurementMethod: "Enrolled / qualified inquiries",
            frequency: "monthly",
            successCriteria: "Conversion at or above 28%",
          };
    case "staffing_issue":
      return {
        title: "Vacancy rate",
        baseline: 12,
        target: 5,
        measurementMethod: "Open instructional roles / total instructional roles",
        frequency: "monthly",
        successCriteria: "Vacancy rate at or below 5%",
      };
    case "customer_experience_issue":
      return {
        title: "Family satisfaction score",
        baseline: 3.4,
        target: 4.2,
        measurementMethod: "Quarterly family survey (1–5)",
        frequency: "quarterly",
        successCriteria: "Average satisfaction ≥ 4.2",
      };
    case "compliance_risk":
      return {
        title: "Open compliance findings",
        baseline: 8,
        target: 0,
        measurementMethod: "Compliance register open items",
        frequency: "monthly",
        successCriteria: "Zero open high/critical compliance findings",
      };
    case "operational_weakness":
      return {
        title: "Process cycle time (days)",
        baseline: 14,
        target: 7,
        measurementMethod: "Average end-to-end process duration",
        frequency: "weekly",
        successCriteria: "Median cycle time ≤ 7 days",
      };
    case "mission_opportunity":
      return {
        title: "Mission outcome index",
        baseline: 60,
        target: 80,
        measurementMethod: "Composite mission KPI index (0–100)",
        frequency: "quarterly",
        successCriteria: "Mission outcome index ≥ 80",
      };
    case "organizational_risk":
    case undefined:
      return {
        title: "Risk exposure score",
        baseline: 70,
        target: 40,
        measurementMethod: "Weighted organizational risk register score",
        frequency: "monthly",
        successCriteria: "Risk exposure score ≤ 40",
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
