/**
 * Goal Execution Engine — tasks (Sprint 011).
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type { GoalExecutionWorkflow } from "@/lib/platform/execution/workflow";
import type {
  ExecutionTask,
  GoalExecutionMetadata,
  GoalExecutionPriority,
  GoalExecutionWorkflowStatus,
} from "@/lib/platform/execution/types";
import type { IntelligenceEvidenceRef } from "@/lib/platform/intelligence/types";

export interface CreateExecutionTaskInput {
  id?: string;
  initiativeId: string;
  milestoneId?: string | null;
  goalId: string;
  title: string;
  description?: string;
  owner: string;
  dueDate: string;
  priority?: GoalExecutionPriority;
  dependencyIds?: string[];
  completionPercent?: number;
  evidence?: IntelligenceEvidenceRef[];
  notes?: string[];
  status?: GoalExecutionWorkflowStatus;
  metadata?: GoalExecutionMetadata;
}

export interface UpdateExecutionTaskInput {
  title?: string;
  description?: string;
  owner?: string;
  dueDate?: string;
  priority?: GoalExecutionPriority;
  dependencyIds?: string[];
  completionPercent?: number;
  evidence?: IntelligenceEvidenceRef[];
  notes?: string[];
  status?: GoalExecutionWorkflowStatus;
  milestoneId?: string | null;
  metadata?: GoalExecutionMetadata;
  forceStatus?: boolean;
}

export interface GoalExecutionTasksDependencies {
  repository: GoalExecutionRepository;
  workflow: GoalExecutionWorkflow;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Executable work items with owners, due dates, dependencies, and evidence.
 */
export class GoalExecutionTasks {
  private readonly repository: GoalExecutionRepository;
  private readonly workflow: GoalExecutionWorkflow;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionTasksDependencies) {
    this.repository = dependencies.repository;
    this.workflow = dependencies.workflow;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  async create(input: CreateExecutionTaskInput): Promise<ExecutionTask> {
    const timestamp = this.now().toISOString();
    const task: ExecutionTask = {
      id: input.id ?? this.createId(),
      initiativeId: input.initiativeId,
      milestoneId: input.milestoneId ?? null,
      goalId: input.goalId,
      title: input.title,
      description: input.description ?? "",
      owner: input.owner,
      dueDate: input.dueDate,
      priority: input.priority ?? "medium",
      dependencyIds: Object.freeze([...(input.dependencyIds ?? [])]),
      completionPercent: Math.max(0, Math.min(100, input.completionPercent ?? 0)),
      evidence: Object.freeze([...(input.evidence ?? [])]),
      notes: Object.freeze([...(input.notes ?? [])]),
      status: input.status ?? "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
    };
    return this.repository.saveTask(task);
  }

  async update(id: string, patch: UpdateExecutionTaskInput): Promise<ExecutionTask> {
    const existing = await this.repository.findTask(id);
    if (!existing) {
      throw new Error(`Execution task not found: ${id}`);
    }
    const nextStatus =
      patch.status !== undefined
        ? this.workflow.transition(existing.status, patch.status, {
            force: patch.forceStatus,
          })
        : existing.status;

    const updated: ExecutionTask = {
      ...existing,
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      owner: patch.owner ?? existing.owner,
      dueDate: patch.dueDate ?? existing.dueDate,
      priority: patch.priority ?? existing.priority,
      dependencyIds:
        patch.dependencyIds !== undefined
          ? Object.freeze([...patch.dependencyIds])
          : existing.dependencyIds,
      completionPercent:
        patch.completionPercent !== undefined
          ? Math.max(0, Math.min(100, patch.completionPercent))
          : existing.completionPercent,
      evidence:
        patch.evidence !== undefined
          ? Object.freeze([...patch.evidence])
          : existing.evidence,
      notes: patch.notes !== undefined ? Object.freeze([...patch.notes]) : existing.notes,
      status: nextStatus,
      milestoneId:
        patch.milestoneId !== undefined ? patch.milestoneId : existing.milestoneId,
      metadata: patch.metadata !== undefined ? { ...patch.metadata } : existing.metadata,
      updatedAt: this.now().toISOString(),
    };
    return this.repository.saveTask(updated);
  }

  async get(id: string): Promise<ExecutionTask | null> {
    return this.repository.findTask(id);
  }

  async list(filter?: {
    goalId?: string;
    initiativeId?: string;
    milestoneId?: string | null;
  }): Promise<ExecutionTask[]> {
    return this.repository.listTasks(filter);
  }
}
