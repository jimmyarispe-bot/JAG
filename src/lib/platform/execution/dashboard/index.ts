/**
 * Goal Execution Engine — dashboard models (Sprint 011).
 *
 * Strongly typed models for future UI dashboards — no UI here.
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type { ExecutionDashboardModel } from "@/lib/platform/execution/types";

export interface GoalExecutionDashboardDependencies {
  repository: GoalExecutionRepository;
  now?: () => Date;
  createId?: () => string;
}

/**
 * Assembles a typed dashboard payload from repository state.
 */
export class GoalExecutionDashboard {
  private readonly repository: GoalExecutionRepository;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionDashboardDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      (() => `exec-dashboard-${this.now().toISOString()}`);
  }

  async build(options: {
    organizationId?: string | null;
    schoolId?: string | null;
    goalIds?: string[];
  } = {}): Promise<ExecutionDashboardModel> {
    const goals = (await this.repository.listGoals({
      organizationId: options.organizationId,
      includeArchived: false,
    })).filter((goal) => {
      if (options.schoolId !== undefined && goal.schoolId !== options.schoolId) {
        return false;
      }
      if (options.goalIds && options.goalIds.length > 0) {
        return options.goalIds.includes(goal.id);
      }
      return true;
    });

    const goalIds = new Set(goals.map((g) => g.id));
    const objectives = (await this.repository.listObjectives()).filter((o) =>
      goalIds.has(o.goalId)
    );
    const initiatives = (await this.repository.listInitiatives()).filter((i) =>
      goalIds.has(i.goalId)
    );
    const initiativeIds = new Set(initiatives.map((i) => i.id));
    const milestones = (await this.repository.listMilestones()).filter((m) =>
      initiativeIds.has(m.initiativeId)
    );
    const tasks = (await this.repository.listTasks()).filter((t) =>
      goalIds.has(t.goalId)
    );
    const scorecards = (await this.repository.listScorecards()).filter((s) =>
      goalIds.has(s.goalId)
    );
    const progress = (await this.repository.listProgress()).filter(
      (p) =>
        (p.subjectKind === "goal" && goalIds.has(p.subjectId)) ||
        (p.subjectKind === "initiative" && initiativeIds.has(p.subjectId)) ||
        (p.subjectKind === "task" && tasks.some((t) => t.id === p.subjectId))
    );
    const adjustments = (await this.repository.listAdjustments()).filter((a) =>
      goalIds.has(a.subjectId) ||
      tasks.some((t) => t.id === a.subjectId) ||
      initiatives.some((i) => i.id === a.subjectId)
    );
    const impact = (await this.repository.listImpact()).filter((i) =>
      goalIds.has(i.goalId)
    );
    const notifications = await this.repository.listNotifications({
      acknowledged: false,
    });

    const nowMs = this.now().getTime();
    const overdueTasks = tasks.filter(
      (t) => t.completionPercent < 100 && Date.parse(t.dueDate) < nowMs
    ).length;
    const atRiskItems = progress.filter(
      (p) => p.healthLabel === "at_risk" || p.healthLabel === "critical"
    ).length;
    const averageCompletion =
      progress.length === 0
        ? 0
        : Math.round(
            progress.reduce((sum, p) => sum + p.completionPercent, 0) /
              progress.length
          );
    const averageHealth =
      progress.length === 0
        ? 0
        : Math.round(
            progress.reduce((sum, p) => sum + p.healthScore, 0) / progress.length
          );

    return {
      dashboardId: this.createId(),
      organizationId: options.organizationId ?? null,
      schoolId: options.schoolId ?? null,
      generatedAt: this.now().toISOString(),
      goals,
      objectives,
      initiatives,
      milestones,
      tasks,
      scorecards,
      notifications: notifications.filter(
        (n) =>
          goalIds.has(n.subjectId) ||
          tasks.some((t) => t.id === n.subjectId) ||
          milestones.some((m) => m.id === n.subjectId)
      ),
      progress,
      adjustments,
      impact,
      summary: {
        activeGoals: goals.filter(
          (g) =>
            g.status === "active" ||
            g.status === "on_track" ||
            g.status === "at_risk" ||
            g.status === "behind"
        ).length,
        atRiskItems,
        overdueTasks,
        averageCompletion,
        averageHealth,
      },
      metadata: {},
    };
  }
}
