/**
 * Goal Execution Engine — milestones (Sprint 011).
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type { GoalExecutionWorkflow } from "@/lib/platform/execution/workflow";
import type {
  ExecutionMilestone,
  GoalExecutionMetadata,
  GoalExecutionWorkflowStatus,
} from "@/lib/platform/execution/types";

export interface CreateExecutionMilestoneInput {
  id?: string;
  initiativeId: string;
  title: string;
  dueDate: string;
  status?: GoalExecutionWorkflowStatus;
  completionPercent?: number;
  strategicMilestoneId?: string | null;
  metadata?: GoalExecutionMetadata;
}

export interface UpdateExecutionMilestoneInput {
  title?: string;
  dueDate?: string;
  status?: GoalExecutionWorkflowStatus;
  completionPercent?: number;
  metadata?: GoalExecutionMetadata;
  forceStatus?: boolean;
}

export interface GoalExecutionMilestonesDependencies {
  repository: GoalExecutionRepository;
  workflow: GoalExecutionWorkflow;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-ms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Initiative milestones with due dates and completion.
 */
export class GoalExecutionMilestones {
  private readonly repository: GoalExecutionRepository;
  private readonly workflow: GoalExecutionWorkflow;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionMilestonesDependencies) {
    this.repository = dependencies.repository;
    this.workflow = dependencies.workflow;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  async create(input: CreateExecutionMilestoneInput): Promise<ExecutionMilestone> {
    const timestamp = this.now().toISOString();
    const milestone: ExecutionMilestone = {
      id: input.id ?? this.createId(),
      initiativeId: input.initiativeId,
      title: input.title,
      dueDate: input.dueDate,
      status: input.status ?? "planning",
      completionPercent: Math.max(0, Math.min(100, input.completionPercent ?? 0)),
      strategicMilestoneId: input.strategicMilestoneId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
    };
    return this.repository.saveMilestone(milestone);
  }

  async update(
    id: string,
    patch: UpdateExecutionMilestoneInput
  ): Promise<ExecutionMilestone> {
    const existing = await this.repository.findMilestone(id);
    if (!existing) {
      throw new Error(`Execution milestone not found: ${id}`);
    }
    const nextStatus =
      patch.status !== undefined
        ? this.workflow.transition(existing.status, patch.status, {
            force: patch.forceStatus,
          })
        : existing.status;

    const updated: ExecutionMilestone = {
      ...existing,
      title: patch.title ?? existing.title,
      dueDate: patch.dueDate ?? existing.dueDate,
      status: nextStatus,
      completionPercent:
        patch.completionPercent !== undefined
          ? Math.max(0, Math.min(100, patch.completionPercent))
          : existing.completionPercent,
      metadata: patch.metadata !== undefined ? { ...patch.metadata } : existing.metadata,
      updatedAt: this.now().toISOString(),
    };
    return this.repository.saveMilestone(updated);
  }

  async get(id: string): Promise<ExecutionMilestone | null> {
    return this.repository.findMilestone(id);
  }

  async list(filter?: { initiativeId?: string }): Promise<ExecutionMilestone[]> {
    return this.repository.listMilestones(filter);
  }
}
