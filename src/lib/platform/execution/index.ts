/**
 * Goal Execution Engine — public API (Sprint 011).
 *
 * Extends Strategic Intelligence with goal/objective/initiative/task execution.
 * Distinct from `@/lib/platform/execution-engine` (workspace runtime).
 */

export {
  DEFAULT_EXECUTION_CONFIDENCE,
  GOAL_EXECUTION_DEPENDENCY_KINDS,
  GOAL_EXECUTION_ENGINE_VERSION,
  GOAL_EXECUTION_ENTITY_KINDS,
  GOAL_EXECUTION_FEEDBACK_SOURCES,
  GOAL_EXECUTION_HEALTH_LABELS,
  GOAL_EXECUTION_IMPACT_DIMENSIONS,
  GOAL_EXECUTION_NOTIFICATION_KINDS,
  GOAL_EXECUTION_PRIORITIES,
  GOAL_EXECUTION_WORKFLOW_STATUSES,
  type ExecutionAdjustment,
  type ExecutionDashboardModel,
  type ExecutionDependency,
  type ExecutionFeedbackInput,
  type ExecutionGoal,
  type ExecutionImpactAssessment,
  type ExecutionImpactScore,
  type ExecutionInitiative,
  type ExecutionMilestone,
  type ExecutionNotification,
  type ExecutionObjective,
  type ExecutionOwners,
  type ExecutionProgressSnapshot,
  type ExecutionReport,
  type ExecutionScorecard,
  type ExecutionTask,
  type GoalExecutionDependencyKind,
  type GoalExecutionEntityKind,
  type GoalExecutionFeedbackSource,
  type GoalExecutionHealthLabel,
  type GoalExecutionImpactDimension,
  type GoalExecutionIntegrationInput,
  type GoalExecutionMetadata,
  type GoalExecutionNotificationKind,
  type GoalExecutionPriority,
  type GoalExecutionWorkflowStatus,
} from "@/lib/platform/execution/types";

export {
  InMemoryGoalExecutionRepository,
  type GoalExecutionRepository,
} from "@/lib/platform/execution/repository";

export {
  GoalExecutionWorkflow,
  type GoalExecutionWorkflowDependencies,
} from "@/lib/platform/execution/workflow";

export {
  GoalExecutionGoals,
  type CreateExecutionGoalInput,
  type GoalExecutionGoalsDependencies,
  type UpdateExecutionGoalInput,
} from "@/lib/platform/execution/goals";

export {
  GoalExecutionObjectives,
  type CreateExecutionObjectiveInput,
  type GoalExecutionObjectivesDependencies,
  type UpdateExecutionObjectiveInput,
} from "@/lib/platform/execution/objectives";

export {
  GoalExecutionInitiatives,
  type CreateExecutionInitiativeInput,
  type GoalExecutionInitiativesDependencies,
  type UpdateExecutionInitiativeInput,
} from "@/lib/platform/execution/initiatives";

export {
  GoalExecutionMilestones,
  type CreateExecutionMilestoneInput,
  type GoalExecutionMilestonesDependencies,
  type UpdateExecutionMilestoneInput,
} from "@/lib/platform/execution/milestones";

export {
  GoalExecutionTasks,
  type CreateExecutionTaskInput,
  type GoalExecutionTasksDependencies,
  type UpdateExecutionTaskInput,
} from "@/lib/platform/execution/tasks";

export {
  GoalExecutionOwnersService,
  type AssignExecutionOwnersInput,
  type GoalExecutionOwnersDependencies,
} from "@/lib/platform/execution/owners";

export {
  GoalExecutionDependencies,
  type CreateExecutionDependencyInput,
  type GoalExecutionDependenciesServiceDependencies,
} from "@/lib/platform/execution/dependencies";

export {
  GoalExecutionProgress,
  type GoalExecutionProgressDependencies,
} from "@/lib/platform/execution/progress";

export {
  GoalExecutionAdjustments,
  type GoalExecutionAdjustmentsDependencies,
} from "@/lib/platform/execution/adjustments";

export {
  GoalExecutionScorecardService,
  type GoalExecutionScorecardDependencies,
} from "@/lib/platform/execution/scorecard";

export {
  GoalExecutionImpact,
  type GoalExecutionImpactDependencies,
} from "@/lib/platform/execution/impact";

export {
  GoalExecutionNotifications,
  type GoalExecutionNotificationsDependencies,
} from "@/lib/platform/execution/notifications";

export {
  GoalExecutionDashboard,
  type GoalExecutionDashboardDependencies,
} from "@/lib/platform/execution/dashboard";

export {
  GoalExecutionReports,
  type GoalExecutionReportsDependencies,
} from "@/lib/platform/execution/reports";

export {
  GoalExecutionIntegration,
  type GoalExecutionIntegrationDependencies,
  type GoalExecutionIntegrationResult,
} from "@/lib/platform/execution/integration";

import { GoalExecutionAdjustments } from "@/lib/platform/execution/adjustments";
import { GoalExecutionDashboard } from "@/lib/platform/execution/dashboard";
import { GoalExecutionDependencies } from "@/lib/platform/execution/dependencies";
import { GoalExecutionGoals } from "@/lib/platform/execution/goals";
import { GoalExecutionImpact } from "@/lib/platform/execution/impact";
import { GoalExecutionInitiatives } from "@/lib/platform/execution/initiatives";
import { GoalExecutionIntegration } from "@/lib/platform/execution/integration";
import { GoalExecutionMilestones } from "@/lib/platform/execution/milestones";
import { GoalExecutionNotifications } from "@/lib/platform/execution/notifications";
import { GoalExecutionObjectives } from "@/lib/platform/execution/objectives";
import { GoalExecutionOwnersService } from "@/lib/platform/execution/owners";
import { GoalExecutionProgress } from "@/lib/platform/execution/progress";
import {
  InMemoryGoalExecutionRepository,
  type GoalExecutionRepository,
} from "@/lib/platform/execution/repository";
import { GoalExecutionReports } from "@/lib/platform/execution/reports";
import { GoalExecutionScorecardService } from "@/lib/platform/execution/scorecard";
import { GoalExecutionTasks } from "@/lib/platform/execution/tasks";
import type { GoalExecutionIntegrationInput } from "@/lib/platform/execution/types";
import { GoalExecutionWorkflow } from "@/lib/platform/execution/workflow";
import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";

/** Injected collaborators for {@link GoalExecutionEngine}. */
export interface GoalExecutionEngineDependencies {
  repository?: GoalExecutionRepository;
  workflow?: GoalExecutionWorkflow;
  memory?: PersistentIntelligenceMemory;
  now?: () => Date;
  createId?: () => string;
}

/**
 * Fully wired Goal Execution Engine façade.
 */
export class GoalExecutionEngine {
  readonly repository: GoalExecutionRepository;
  readonly workflow: GoalExecutionWorkflow;
  readonly goals: GoalExecutionGoals;
  readonly objectives: GoalExecutionObjectives;
  readonly initiatives: GoalExecutionInitiatives;
  readonly milestones: GoalExecutionMilestones;
  readonly tasks: GoalExecutionTasks;
  readonly owners: GoalExecutionOwnersService;
  readonly dependencies: GoalExecutionDependencies;
  readonly progress: GoalExecutionProgress;
  readonly adjustments: GoalExecutionAdjustments;
  readonly scorecards: GoalExecutionScorecardService;
  readonly impact: GoalExecutionImpact;
  readonly notifications: GoalExecutionNotifications;
  readonly dashboard: GoalExecutionDashboard;
  readonly reports: GoalExecutionReports;
  readonly integration: GoalExecutionIntegration;

  constructor(dependencies: GoalExecutionEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId = dependencies.createId;
    this.repository =
      dependencies.repository ?? new InMemoryGoalExecutionRepository();
    this.workflow = dependencies.workflow ?? new GoalExecutionWorkflow();

    this.goals = new GoalExecutionGoals({
      repository: this.repository,
      workflow: this.workflow,
      now,
      createId,
    });
    this.objectives = new GoalExecutionObjectives({
      repository: this.repository,
      now,
      createId,
    });
    this.initiatives = new GoalExecutionInitiatives({
      repository: this.repository,
      workflow: this.workflow,
      now,
      createId,
    });
    this.milestones = new GoalExecutionMilestones({
      repository: this.repository,
      workflow: this.workflow,
      now,
      createId,
    });
    this.tasks = new GoalExecutionTasks({
      repository: this.repository,
      workflow: this.workflow,
      now,
      createId,
    });
    this.owners = new GoalExecutionOwnersService({
      repository: this.repository,
      now,
    });
    this.dependencies = new GoalExecutionDependencies({
      repository: this.repository,
      now,
      createId,
    });
    this.progress = new GoalExecutionProgress({
      repository: this.repository,
      objectives: this.objectives,
      now,
    });
    this.adjustments = new GoalExecutionAdjustments({
      repository: this.repository,
      now,
      createId,
    });
    this.scorecards = new GoalExecutionScorecardService({
      repository: this.repository,
      progress: this.progress,
      now,
    });
    this.impact = new GoalExecutionImpact({
      repository: this.repository,
      now,
    });
    this.notifications = new GoalExecutionNotifications({
      repository: this.repository,
      now,
      createId,
    });
    this.dashboard = new GoalExecutionDashboard({
      repository: this.repository,
      now,
      createId,
    });
    this.reports = new GoalExecutionReports({
      dashboard: this.dashboard,
      scorecards: this.scorecards,
      impact: this.impact,
      now,
      createId,
    });
    this.integration = new GoalExecutionIntegration({
      goals: this.goals,
      objectives: this.objectives,
      initiatives: this.initiatives,
      milestones: this.milestones,
      tasks: this.tasks,
      owners: this.owners,
      dependencies: this.dependencies,
      workflow: this.workflow,
      memory: dependencies.memory,
      now,
    });
  }

  /** Import Strategic Intelligence into the execution engine. */
  async importStrategic(input: GoalExecutionIntegrationInput) {
    return this.integration.importStrategic(input);
  }
}

/** Factory for a fully wired Goal Execution Engine. */
export function createGoalExecutionEngine(
  dependencies: GoalExecutionEngineDependencies = {}
): GoalExecutionEngine {
  return new GoalExecutionEngine(dependencies);
}
