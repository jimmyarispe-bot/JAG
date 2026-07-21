/**
 * Goal Execution Engine — Intelligence integrations (Sprint 011).
 *
 * Imports Strategic Intelligence packages and optionally records
 * Persistent Memory snapshots. Uses Shared Context for org scope.
 */

import type { GoalExecutionDependencies } from "@/lib/platform/execution/dependencies";
import type { GoalExecutionGoals } from "@/lib/platform/execution/goals";
import type { GoalExecutionInitiatives } from "@/lib/platform/execution/initiatives";
import type { GoalExecutionMilestones } from "@/lib/platform/execution/milestones";
import type { GoalExecutionObjectives } from "@/lib/platform/execution/objectives";
import type { GoalExecutionOwnersService } from "@/lib/platform/execution/owners";
import type { GoalExecutionTasks } from "@/lib/platform/execution/tasks";
import type { GoalExecutionWorkflow } from "@/lib/platform/execution/workflow";
import type {
  ExecutionGoal,
  ExecutionInitiative,
  ExecutionMilestone,
  ExecutionObjective,
  ExecutionOwners,
  ExecutionTask,
  GoalExecutionIntegrationInput,
} from "@/lib/platform/execution/types";
import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";
import type {
  StrategicGoal,
  StrategicInitiative,
  StrategicObjective,
} from "@/lib/platform/intelligence/domains/strategic/types";

export interface GoalExecutionIntegrationResult {
  readonly goals: readonly ExecutionGoal[];
  readonly objectives: readonly ExecutionObjective[];
  readonly initiatives: readonly ExecutionInitiative[];
  readonly milestones: readonly ExecutionMilestone[];
  readonly tasks: readonly ExecutionTask[];
  readonly owners: ExecutionOwners | null;
  readonly memoryId: string | null;
}

export interface GoalExecutionIntegrationDependencies {
  goals: GoalExecutionGoals;
  objectives: GoalExecutionObjectives;
  initiatives: GoalExecutionInitiatives;
  milestones: GoalExecutionMilestones;
  tasks: GoalExecutionTasks;
  owners: GoalExecutionOwnersService;
  dependencies: GoalExecutionDependencies;
  workflow: GoalExecutionWorkflow;
  memory?: PersistentIntelligenceMemory;
  now?: () => Date;
}

/**
 * Bridges Strategic / Executive Intelligence into the Goal Execution Engine.
 */
export class GoalExecutionIntegration {
  private readonly goals: GoalExecutionGoals;
  private readonly objectives: GoalExecutionObjectives;
  private readonly initiatives: GoalExecutionInitiatives;
  private readonly milestones: GoalExecutionMilestones;
  private readonly tasks: GoalExecutionTasks;
  private readonly owners: GoalExecutionOwnersService;
  private readonly dependencies: GoalExecutionDependencies;
  private readonly workflow: GoalExecutionWorkflow;
  private readonly memory: PersistentIntelligenceMemory | null;
  private readonly now: () => Date;

  constructor(dependencies: GoalExecutionIntegrationDependencies) {
    this.goals = dependencies.goals;
    this.objectives = dependencies.objectives;
    this.initiatives = dependencies.initiatives;
    this.milestones = dependencies.milestones;
    this.tasks = dependencies.tasks;
    this.owners = dependencies.owners;
    this.dependencies = dependencies.dependencies;
    this.workflow = dependencies.workflow;
    this.memory = dependencies.memory ?? null;
    this.now = dependencies.now ?? (() => new Date());
  }

  /**
   * Import a Strategic Intelligence result (or partial package) into execution.
   */
  async importStrategic(
    input: GoalExecutionIntegrationInput
  ): Promise<GoalExecutionIntegrationResult> {
    const strategic = input.strategic;
    const strategicGoals: readonly StrategicGoal[] =
      input.strategicGoals ?? strategic?.goals ?? [];
    const strategicObjectives: readonly StrategicObjective[] =
      input.strategicObjectives ?? strategic?.objectives ?? [];
    const strategicInitiatives: readonly StrategicInitiative[] =
      input.strategicInitiatives ?? strategic?.initiatives ?? [];
    const strategicOwners = input.strategicOwners ?? strategic?.owners;

    const organizationId =
      input.organizationId ??
      input.sharedContext?.scope.organizationId ??
      null;
    const schoolId =
      input.schoolId ?? input.sharedContext?.scope.schoolId ?? null;

    const goals: ExecutionGoal[] = await Promise.all(
      strategicGoals.map(async (goal) => {
        const mappedStatus = mapStrategicGoalStatus(goal.status);
        return this.goals.create({
          id: `exec:${goal.id}`,
          title: goal.title,
          description: goal.description,
          priority: goal.priority,
          status: this.workflow.canTransition("draft", mappedStatus)
            ? mappedStatus
            : "draft",
          targetDate: goal.targetDate,
          expectedValue: goal.expectedValue,
          confidence: goal.confidence,
          linkedOpportunityIds: [...goal.linkedOpportunities],
          strategicGoalId: goal.id,
          organizationId,
          schoolId,
          metadata: {
            ...(input.metadata ?? {}),
            ...(goal.metadata ?? {}),
            importedFrom: "strategic_intelligence",
            sharedContextRequestId: input.sharedContext?.requestId ?? null,
          },
          createdAt: goal.createdDate,
        });
      })
    );

    const objectives: ExecutionObjective[] = await Promise.all(
      strategicObjectives.map(async (objective) => {
        const goalId = `exec:${objective.goalId}`;
        const created = await this.objectives.create({
          id: `exec:${objective.id}`,
          goalId,
          title: objective.title,
          description: objective.description,
          baseline: objective.baseline,
          target: objective.target,
          currentValue: objective.currentValue,
          measurementMethod: objective.measurementMethod,
          frequency: objective.frequency,
          successCriteria: objective.successCriteria,
          status: "planning",
          strategicObjectiveId: objective.id,
          metadata: { ...(objective.metadata ?? {}) },
        });
        await this.dependencies.link({
          kind: "measures",
          fromKind: "objective",
          fromId: created.id,
          toKind: "goal",
          toId: goalId,
        });
        return created;
      })
    );

    const initiativeBundles = await Promise.all(
      strategicInitiatives.map(async (initiative) => {
        const goalId = `exec:${initiative.goalId}`;
        const created = await this.initiatives.create({
          id: `exec:${initiative.id}`,
          goalId,
          objectiveIds: initiative.objectiveIds.map((id) => `exec:${id}`),
          title: initiative.title,
          description: initiative.description,
          status: mapStrategicExecutionStatus(initiative.status),
          budgetAmount: initiative.budget.amount,
          budgetCurrency: initiative.budget.currency,
          budgetSpent: 0,
          resources: [...initiative.resources],
          startDate: initiative.timeline.startDate,
          endDate: initiative.timeline.endDate,
          strategicInitiativeId: initiative.id,
          metadata: { ...(initiative.metadata ?? {}) },
        });

        await this.dependencies.link({
          kind: "contributes_to",
          fromKind: "initiative",
          fromId: created.id,
          toKind: "goal",
          toId: goalId,
        });

        await Promise.all(
          initiative.dependencies.map((depId) =>
            this.dependencies.link({
              kind: "requires",
              fromKind: "initiative",
              fromId: created.id,
              toKind: "initiative",
              toId: depId.startsWith("exec:") ? depId : `exec:${depId}`,
            })
          )
        );

        const milestonePairs = await Promise.all(
          initiative.milestones.map(async (milestone, index) => {
            const ms = await this.milestones.create({
              id: `exec:${milestone.milestoneId}`,
              initiativeId: created.id,
              title: milestone.title,
              dueDate: milestone.dueDate,
              status: mapStrategicExecutionStatus(milestone.status),
              completionPercent: 0,
              strategicMilestoneId: milestone.milestoneId,
            });

            const task = await this.tasks.create({
              id: `exec:${milestone.milestoneId}:task`,
              initiativeId: created.id,
              milestoneId: ms.id,
              goalId,
              title: `Deliver: ${milestone.title}`,
              description: `Work item for milestone ${milestone.title}`,
              owner: strategicOwners?.primaryOwner ?? "Unassigned",
              dueDate: milestone.dueDate,
              priority: goals[0]?.priority ?? "medium",
              completionPercent: 0,
              status: "planning",
              notes: [`Auto-created from strategic milestone ${index + 1}`],
            });

            return { ms, task };
          })
        );

        return { created, milestonePairs };
      })
    );

    const initiatives: ExecutionInitiative[] = initiativeBundles.map((b) => b.created);
    const milestones: ExecutionMilestone[] = initiativeBundles.flatMap((b) =>
      b.milestonePairs.map((p) => p.ms)
    );
    const tasks: ExecutionTask[] = initiativeBundles.flatMap((b) =>
      b.milestonePairs.map((p) => p.task)
    );

    let owners: ExecutionOwners | null = null;
    if (strategicOwners && goals[0]) {
      owners = await this.owners.assign({
        subjectKind: "goal",
        subjectId: goals[0].id,
        primaryOwner: strategicOwners.primaryOwner,
        executiveSponsor: strategicOwners.executiveSponsor,
        supportingTeam: [...strategicOwners.supportingTeam],
        approver: strategicOwners.approver,
        metadata: { ...(strategicOwners.metadata ?? {}) },
      });
    }

    let memoryId: string | null = null;
    if (this.memory && goals.length > 0) {
      const record = this.memory.createMemory({
        domain: "strategic",
        executionId: strategic?.requestId ?? `goal-execution-${this.now().toISOString()}`,
        organizationId,
        schoolId,
        observations: goals.map((g) => `Imported goal ${g.title}`),
        recommendations: [
          "Track imported strategic goals in the Goal Execution Engine",
        ],
        assumptions: ["Strategic Intelligence package is authoritative at import time"],
        evidence: [],
        confidence: goals[0]!.confidence,
        contextSnapshot: {
          sharedContextRequestId: input.sharedContext?.requestId ?? null,
          goalCount: goals.length,
        },
        request: {
          source: "goal_execution_integration",
          strategicRequestId: strategic?.requestId ?? null,
        },
        metadata: {
          engine: "goal-execution",
          version: "0.1.0",
        },
      });
      const saved = await this.memory.saveMemory(record);
      memoryId = saved.id;
    }

    return {
      goals,
      objectives,
      initiatives,
      milestones,
      tasks,
      owners,
      memoryId,
    };
  }
}

function mapStrategicGoalStatus(
  status: StrategicGoal["status"]
): import("@/lib/platform/execution/types").GoalExecutionWorkflowStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "proposed":
      return "draft";
    case "approved":
      return "approved";
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function mapStrategicExecutionStatus(
  status: StrategicInitiative["status"]
): import("@/lib/platform/execution/types").GoalExecutionWorkflowStatus {
  switch (status) {
    case "planning":
      return "planning";
    case "active":
      return "active";
    case "on_track":
      return "on_track";
    case "behind":
      return "behind";
    case "blocked":
      return "blocked";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
