/**
 * Goal Execution Engine — notifications (Sprint 011).
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

    const nowIso = this.now().toISOString();
    const nowMs = this.now().getTime();
    const created: ExecutionNotification[] = [];

    const tasks = await this.repository.listTasks({ goalId });
    for (const task of tasks) {
      if (task.completionPercent < 100 && Date.parse(task.dueDate) < nowMs) {
        created.push(
          await this.emit({
            kind: "overdue",
            subjectKind: "task",
            subjectId: task.id,
            title: `Overdue task: ${task.title}`,
            message: `Task "${task.title}" was due ${task.dueDate.slice(0, 10)} and is ${task.completionPercent}% complete.`,
            severity: task.priority === "critical" ? "critical" : "high",
          })
        );
      }
      if (task.completionPercent >= 100 || task.status === "completed") {
        created.push(
          await this.emit({
            kind: "completion",
            subjectKind: "task",
            subjectId: task.id,
            title: `Completed task: ${task.title}`,
            message: `Task "${task.title}" reached completion.`,
            severity: "low",
          })
        );
      }
    }

    const initiatives = await this.repository.listInitiatives({ goalId });
    for (const initiative of initiatives) {
      const milestones = await this.repository.listMilestones({
        initiativeId: initiative.id,
      });
      for (const milestone of milestones) {
        const dueMs = Date.parse(milestone.dueDate);
        const daysUntil = (dueMs - nowMs) / (1000 * 60 * 60 * 24);
        if (
          milestone.completionPercent < 100 &&
          daysUntil <= 7 &&
          Number.isFinite(daysUntil)
        ) {
          created.push(
            await this.emit({
              kind: "milestone",
              subjectKind: "milestone",
              subjectId: milestone.id,
              title: `Milestone alert: ${milestone.title}`,
              message: `Milestone "${milestone.title}" is due ${milestone.dueDate.slice(0, 10)} (${milestone.completionPercent}% complete).`,
              severity: daysUntil < 0 ? "high" : "medium",
            })
          );
        }
      }
    }

    const progress = await this.repository.listProgress({ subjectId: goalId });
    const latest = progress[0];
    if (
      latest &&
      (latest.healthLabel === "at_risk" || latest.healthLabel === "critical")
    ) {
      created.push(
        await this.emit({
          kind: "risk",
          subjectKind: "goal",
          subjectId: goalId,
          title: `Risk alert: ${goal.title}`,
          message: `Goal "${goal.title}" health is ${latest.healthLabel} (risk ${latest.riskScore}).`,
          severity: latest.healthLabel === "critical" ? "critical" : "high",
        })
      );
    }

    if (goal.status === "completed" || (latest && latest.completionPercent >= 100)) {
      created.push(
        await this.emit({
          kind: "completion",
          subjectKind: "goal",
          subjectId: goalId,
          title: `Goal completed: ${goal.title}`,
          message: `Goal "${goal.title}" has reached completion.`,
          severity: "medium",
        })
      );
    }

    void nowIso;
    return created;
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
