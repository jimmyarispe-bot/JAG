/**
 * Goal Execution Engine — objectives (Sprint 011).
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type {
  ExecutionObjective,
  GoalExecutionMetadata,
  GoalExecutionWorkflowStatus,
} from "@/lib/platform/execution/types";

export interface CreateExecutionObjectiveInput {
  id?: string;
  goalId: string;
  title: string;
  description: string;
  baseline: number;
  target: number;
  currentValue?: number;
  measurementMethod: string;
  frequency: string;
  successCriteria: string;
  status?: GoalExecutionWorkflowStatus;
  strategicObjectiveId?: string | null;
  metadata?: GoalExecutionMetadata;
}

export interface UpdateExecutionObjectiveInput {
  title?: string;
  description?: string;
  baseline?: number;
  target?: number;
  currentValue?: number;
  measurementMethod?: string;
  frequency?: string;
  successCriteria?: string;
  status?: GoalExecutionWorkflowStatus;
  metadata?: GoalExecutionMetadata;
}

export interface GoalExecutionObjectivesDependencies {
  repository: GoalExecutionRepository;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Measurable execution objectives.
 */
export class GoalExecutionObjectives {
  private readonly repository: GoalExecutionRepository;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionObjectivesDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  async create(input: CreateExecutionObjectiveInput): Promise<ExecutionObjective> {
    const timestamp = this.now().toISOString();
    const objective: ExecutionObjective = {
      id: input.id ?? this.createId(),
      goalId: input.goalId,
      title: input.title,
      description: input.description,
      baseline: input.baseline,
      target: input.target,
      currentValue: input.currentValue ?? input.baseline,
      measurementMethod: input.measurementMethod,
      frequency: input.frequency,
      successCriteria: input.successCriteria,
      status: input.status ?? "draft",
      strategicObjectiveId: input.strategicObjectiveId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
    };
    return this.repository.saveObjective(objective);
  }

  async update(
    id: string,
    patch: UpdateExecutionObjectiveInput
  ): Promise<ExecutionObjective> {
    const existing = await this.repository.findObjective(id);
    if (!existing) {
      throw new Error(`Execution objective not found: ${id}`);
    }
    const updated: ExecutionObjective = {
      ...existing,
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      baseline: patch.baseline ?? existing.baseline,
      target: patch.target ?? existing.target,
      currentValue: patch.currentValue ?? existing.currentValue,
      measurementMethod: patch.measurementMethod ?? existing.measurementMethod,
      frequency: patch.frequency ?? existing.frequency,
      successCriteria: patch.successCriteria ?? existing.successCriteria,
      status: patch.status ?? existing.status,
      metadata: patch.metadata !== undefined ? { ...patch.metadata } : existing.metadata,
      updatedAt: this.now().toISOString(),
    };
    return this.repository.saveObjective(updated);
  }

  async get(id: string): Promise<ExecutionObjective | null> {
    return this.repository.findObjective(id);
  }

  async list(filter?: { goalId?: string }): Promise<ExecutionObjective[]> {
    return this.repository.listObjectives(filter);
  }

  /** Completion percent for an objective (0–100). */
  completionPercent(objective: ExecutionObjective): number {
    const span = objective.target - objective.baseline;
    if (span === 0) {
      return objective.currentValue === objective.target ? 100 : 0;
    }
    const ratio = (objective.currentValue - objective.baseline) / span;
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }
}
