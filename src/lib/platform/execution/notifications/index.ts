/**
 * Goal Execution Engine — notifications (Sprint 011).
 * P009 — parallel list loads + batched emit; milestone scan uses one list + Map.
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type {
  ExecutionNotification,
  GoalExecutionNotificationKind,
  GoalExecutionPriority,
} from "@/lib/platform/execution/types";

export interface GoalExecutionNotificationsDependencies {
  repository: GoalExecutionRepository;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generates overdue, risk, milestone, and completion alerts.
 */
export class GoalExecutionNotifications {
  private readonly repository: GoalExecutionRepository;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionNotificationsDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  /**
   * Scan goals/tasks/milestones and emit applicable notifications.
   */
  async generateForGoal(goalId: string): Promise<ExecutionNotification[]> {
    const goal = await this.repository.findGoal(goalId);
    if (!goal) {
      throw new Error(`Execution goal not found: ${goalId}`);
    }

    const nowMs = this.now().getTime();
    const emitJobs: Array<Parameters<GoalExecutionNotifications["emit"]>[0]> = [];

    const [tasks, initiatives, progress, allMilestones] = await Promise.all([
      this.repository.listTasks({ goalId }),
      this.repository.listInitiatives({ goalId }),
      this.repository.listProgress({ subjectId: goalId }),
      this.repository.listMilestones(),
    ]);

    for (const task of tasks) {
      if (task.completionPercent < 100 && Date.parse(task.dueDate) < nowMs) {
        emitJobs.push({
          kind: "overdue",
          subjectKind: "task",
          subjectId: task.id,
          title: `Overdue task: ${task.title}`,
          message: `Task "${task.title}" was due ${task.dueDate.slice(0, 10)} and is ${task.completionPercent}% complete.`,
          severity: task.priority === "critical" ? "critical" : "high",
        });
      }
      if (task.completionPercent >= 100 || task.status === "completed") {
        emitJobs.push({
          kind: "completion",
          subjectKind: "task",
          subjectId: task.id,
          title: `Completed task: ${task.title}`,
          message: `Task "${task.title}" reached completion.`,
          severity: "low",
        });
      }
    }

    const initiativeIds = new Set(initiatives.map((i) => i.id));
    for (const milestone of allMilestones) {
      if (!initiativeIds.has(milestone.initiativeId)) continue;
      const dueMs = Date.parse(milestone.dueDate);
      const daysUntil = (dueMs - nowMs) / (1000 * 60 * 60 * 24);
      if (
        milestone.completionPercent < 100 &&
        daysUntil <= 7 &&
        Number.isFinite(daysUntil)
      ) {
        emitJobs.push({
          kind: "milestone",
          subjectKind: "milestone",
          subjectId: milestone.id,
          title: `Milestone alert: ${milestone.title}`,
          message: `Milestone "${milestone.title}" is due ${milestone.dueDate.slice(0, 10)} (${milestone.completionPercent}% complete).`,
          severity: daysUntil < 0 ? "high" : "medium",
        });
      }
    }

    const latest = progress[0];
    if (
      latest &&
      (latest.healthLabel === "at_risk" || latest.healthLabel === "critical")
    ) {
      emitJobs.push({
        kind: "risk",
        subjectKind: "goal",
        subjectId: goalId,
        title: `Risk alert: ${goal.title}`,
        message: `Goal "${goal.title}" health is ${latest.healthLabel} (risk ${latest.riskScore}).`,
        severity: latest.healthLabel === "critical" ? "critical" : "high",
      });
    }

    if (goal.status === "completed" || (latest && latest.completionPercent >= 100)) {
      emitJobs.push({
        kind: "completion",
        subjectKind: "goal",
        subjectId: goalId,
        title: `Goal completed: ${goal.title}`,
        message: `Goal "${goal.title}" has reached completion.`,
        severity: "medium",
      });
    }

    return Promise.all(emitJobs.map((job) => this.emit(job)));
  }

  async list(filter?: { acknowledged?: boolean }): Promise<ExecutionNotification[]> {
    return this.repository.listNotifications(filter);
  }

  async acknowledge(id: string): Promise<ExecutionNotification> {
    const all = await this.repository.listNotifications();
    const existing = all.find((n) => n.id === id);
    if (!existing) {
      throw new Error(`Execution notification not found: ${id}`);
    }
    return this.repository.saveNotification({ ...existing, acknowledged: true });
  }

  private async emit(input: {
    kind: GoalExecutionNotificationKind;
    subjectKind: ExecutionNotification["subjectKind"];
    subjectId: string;
    title: string;
    message: string;
    severity: GoalExecutionPriority;
  }): Promise<ExecutionNotification> {
    const notification: ExecutionNotification = {
      id: this.createId(),
      kind: input.kind,
      subjectKind: input.subjectKind,
      subjectId: input.subjectId,
      title: input.title,
      message: input.message,
      severity: input.severity,
      createdAt: this.now().toISOString(),
      acknowledged: false,
      metadata: {},
    };
    return this.repository.saveNotification(notification);
  }
}
