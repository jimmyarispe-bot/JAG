/**
 * JAG Collaboration — execution package builder.
 *
 * Creates packages compatible with the Goal Execution Engine.
 */

import type {
  JagCollaborationExecutionPackage,
  JagCollaborationPlan,
  JagCollaborationRequest,
  JagConsensusResult,
  JagModeratedCollaboration,
} from "@/lib/platform/jag/collaboration/types";
import type {
  CreateExecutionGoalInput,
  CreateExecutionInitiativeInput,
  CreateExecutionObjectiveInput,
  CreateExecutionTaskInput,
} from "@/lib/platform/execution";

export interface JagCollaborationExecutionDependencies {
  now?: () => Date;
}

/**
 * Builds Goal Execution Engine-compatible inputs from collaboration output.
 */
export class JagCollaborationExecution {
  private readonly now: () => Date;

  constructor(dependencies: JagCollaborationExecutionDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  build(
    request: JagCollaborationRequest,
    moderated: JagModeratedCollaboration,
    consensus: JagConsensusResult,
    plan: JagCollaborationPlan
  ): JagCollaborationExecutionPackage {
    const timestamp = this.now();
    const target = new Date(timestamp.getTime());
    target.setUTCDate(target.getUTCDate() + 90);

    const top =
      moderated.mergedRecommendations.find(
        (r) => r.recommendationKey === consensus.recommendationKey
      ) ?? moderated.mergedRecommendations[0];

    const goalId = `${request.requestId}:exec-goal`;
    const objectiveId = `${goalId}:objective:1`;
    const initiativeId = `${goalId}:initiative:1`;

    const goal: CreateExecutionGoalInput = {
      id: goalId,
      title: `Execute: ${consensus.title}`,
      description: consensus.summary,
      priority:
        (top?.urgency ?? 0) >= 0.75
          ? "critical"
          : (top?.urgency ?? 0) >= 0.55
            ? "high"
            : "medium",
      status: "draft",
      targetDate: target.toISOString(),
      expectedValue: top?.summary ?? consensus.summary,
      confidence: top?.confidence ?? {
        value: 0.6,
        level: "medium",
        factors: [],
      },
      organizationId: request.organizationId ?? request.sharedContext?.scope.organizationId ?? null,
      schoolId: request.schoolId ?? request.sharedContext?.scope.schoolId ?? null,
      metadata: {
        source: "jag_collaboration",
        consensusKey: consensus.recommendationKey,
      },
    };

    const objectives: CreateExecutionObjectiveInput[] = [
      {
        id: objectiveId,
        goalId,
        title: "Recommendation realization",
        description: `Track realization of "${consensus.title}"`,
        baseline: 0,
        target: 100,
        currentValue: 0,
        measurementMethod: "Execution completion percent",
        frequency: "weekly",
        successCriteria: "Reach 100% of planned execution milestones",
        status: "draft",
      },
    ];

    const initiatives: CreateExecutionInitiativeInput[] = [
      {
        id: initiativeId,
        goalId,
        objectiveIds: [objectiveId],
        title: `Initiative: ${consensus.title}`,
        description: top?.summary ?? consensus.summary,
        status: "draft",
        budgetAmount: Math.round((top?.cost ?? 0.5) * 100000),
        budgetCurrency: "USD",
        budgetSpent: 0,
        resources: ["Executive sponsor", "Strategic lead", "Execution owner"],
        startDate: timestamp.toISOString(),
        endDate: target.toISOString(),
      },
    ];

    const tasks: Omit<CreateExecutionTaskInput, "goalId" | "initiativeId">[] =
      plan.steps.map((step, index) => ({
        id: `${initiativeId}:task:${index + 1}`,
        title: step.title,
        description: step.instruction,
        owner: step.ownerRole,
        dueDate: addDays(timestamp, (index + 1) * 14).toISOString(),
        priority: index === 0 ? "high" : "medium",
        completionPercent: 0,
        status: "draft",
        notes: [`Plan step ${step.order}`],
        dependencyIds: [...step.dependsOn],
      }));

    return {
      packageId: `${request.requestId}:execution-package`,
      goal,
      objectives,
      initiatives,
      tasks,
      summary: `Execution package ready for Goal Execution Engine (${tasks.length} task(s)).`,
    };
  }
}

function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
