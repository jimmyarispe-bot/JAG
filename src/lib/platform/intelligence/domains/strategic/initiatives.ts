/**
 * Strategic Intelligence — initiatives.
 *
 * Represents executable work linked to goals and objectives.
 */

import type {
  StrategicExecutionStatus,
  StrategicGoal,
  StrategicInitiative,
  StrategicMilestone,
  StrategicObjective,
  StrategicOpportunity,
  StrategicOpportunityKind,
} from "@/lib/platform/intelligence/domains/strategic/types";

/** Options for initiative generation. */
export interface StrategicInitiativesOptions {
  now?: () => Date;
  createId?: (goal: StrategicGoal, index: number) => string;
}

/**
 * Builds executable initiatives with dependencies, milestones, budget, and timeline.
 */
export class StrategicInitiatives {
  private readonly now: () => Date;
  private readonly createId: (goal: StrategicGoal, index: number) => string;

  constructor(options: StrategicInitiativesOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.createId =
      options.createId ?? ((goal, index) => `${goal.id}:initiative:${index}`);
  }

  /**
   * Create one initiative per goal, linked to that goal's objectives.
   */
  createForGoals(
    goals: readonly StrategicGoal[],
    objectives: readonly StrategicObjective[],
    opportunities: readonly StrategicOpportunity[] = []
  ): StrategicInitiative[] {
    const byOpportunity = new Map(
      opportunities.map((o) => [o.opportunityId, o] as const)
    );

    const initiatives: StrategicInitiative[] = [];
    for (let index = 0; index < goals.length; index += 1) {
      const goal = goals[index]!;
      const goalObjectives = objectives.filter((o) => o.goalId === goal.id);
      const kind = goal.linkedOpportunities
        .map((id) => byOpportunity.get(id)?.kind)
        .find((k): k is StrategicOpportunityKind => k !== undefined);
      const initiative = this.createForGoal(goal, goalObjectives, kind, index);
      if (index > 0) {
        const prior = initiatives[index - 1]!;
        initiatives.push({
          ...initiative,
          dependencies: [prior.id],
        });
      } else {
        initiatives.push(initiative);
      }
    }
    return initiatives;
  }

  /**
   * Create an initiative from explicit fields.
   */
  create(input: {
    id: string;
    goalId: string;
    objectiveIds: string[];
    title: string;
    description: string;
    dependencies?: string[];
    milestones?: StrategicMilestone[];
    budget: StrategicInitiative["budget"];
    resources: string[];
    timeline: StrategicInitiative["timeline"];
    status?: StrategicExecutionStatus;
  }): StrategicInitiative {
    return {
      id: input.id,
      goalId: input.goalId,
      objectiveIds: [...input.objectiveIds],
      title: input.title,
      description: input.description,
      dependencies: [...(input.dependencies ?? [])],
      milestones: [...(input.milestones ?? [])],
      budget: { ...input.budget },
      resources: [...input.resources],
      timeline: { ...input.timeline },
      status: input.status ?? "planning",
    };
  }

  private createForGoal(
    goal: StrategicGoal,
    objectives: readonly StrategicObjective[],
    kind: StrategicOpportunityKind | undefined,
    index: number
  ): StrategicInitiative {
    const start = this.now();
    const mid = new Date(start.getTime());
    mid.setUTCDate(mid.getUTCDate() + 30);
    const end = new Date(goal.targetDate);

    const milestones: StrategicMilestone[] = [
      {
        milestoneId: `${this.createId(goal, index)}:m1`,
        title: "Charter and kickoff",
        dueDate: mid.toISOString(),
        status: "planning",
      },
      {
        milestoneId: `${this.createId(goal, index)}:m2`,
        title: "Midpoint review",
        dueDate: new Date((start.getTime() + end.getTime()) / 2).toISOString(),
        status: "planning",
      },
      {
        milestoneId: `${this.createId(goal, index)}:m3`,
        title: "Outcome validation",
        dueDate: end.toISOString(),
        status: "planning",
      },
    ];

    return {
      id: this.createId(goal, index),
      goalId: goal.id,
      objectiveIds: objectives.map((o) => o.id),
      title: `Initiative: ${goal.title.replace(/^Strategic goal:\s*/i, "")}`,
      description: `Executable workstream to deliver "${goal.title}".`,
      dependencies: [],
      milestones,
      budget: budgetFor(kind),
      resources: resourcesFor(kind),
      timeline: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      status: "planning",
    };
  }
}

function budgetFor(kind: StrategicOpportunityKind | undefined): StrategicInitiative["budget"] {
  switch (kind) {
    case "financial_weakness":
      return { amount: 25000, currency: "USD", notes: "Collections and cash ops" };
    case "growth_opportunity":
      return { amount: 40000, currency: "USD", notes: "Recruiting and marketing" };
    case "staffing_issue":
      return { amount: 60000, currency: "USD", notes: "Hiring and retention programs" };
    case "compliance_risk":
      return { amount: 15000, currency: "USD", notes: "Audit remediation" };
    case "customer_experience_issue":
      return { amount: 20000, currency: "USD", notes: "Service design and training" };
    case "mission_opportunity":
      return { amount: 30000, currency: "USD", notes: "Program expansion" };
    case "operational_weakness":
      return { amount: 18000, currency: "USD", notes: "Process improvement" };
    case "organizational_risk":
    case undefined:
      return { amount: 22000, currency: "USD", notes: "Risk mitigation" };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function resourcesFor(kind: StrategicOpportunityKind | undefined): string[] {
  switch (kind) {
    case "financial_weakness":
      return ["Finance lead", "Billing specialist", "Controller"];
    case "growth_opportunity":
      return ["Admissions lead", "Marketing", "Campus principal"];
    case "staffing_issue":
      return ["HR lead", "Instructional coaches", "Principals"];
    case "compliance_risk":
      return ["Compliance officer", "Legal counsel", "Program directors"];
    case "customer_experience_issue":
      return ["Family success lead", "Front office", "Communications"];
    case "mission_opportunity":
      return ["Mission lead", "Program directors", "Community partners"];
    case "operational_weakness":
      return ["Ops lead", "Process owners", "Data analyst"];
    case "organizational_risk":
    case undefined:
      return ["Executive sponsor", "Risk owner", "Cross-functional leads"];
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
