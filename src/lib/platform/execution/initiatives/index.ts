/**
 * Goal Execution Engine — initiatives (Sprint 011).
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type { GoalExecutionWorkflow } from "@/lib/platform/execution/workflow";
import type {
  ExecutionInitiative,
  GoalExecutionMetadata,
  GoalExecutionWorkflowStatus,
} from "@/lib/platform/execution/types";

export interface CreateExecutionInitiativeInput {
  id?: string;
  goalId: string;
  objectiveIds?: string[];
  title: string;
  description: string;
  status?: GoalExecutionWorkflowStatus;
  budgetAmount: number;
  budgetCurrency?: string;
  budgetSpent?: number;
  resources?: string[];
  startDate: string;
  endDate: string;
  strategicInitiativeId?: string | null;
  metadata?: GoalExecutionMetadata;
}

export interface UpdateExecutionInitiativeInput {
  title?: string;
  description?: string;
  objectiveIds?: string[];
  status?: GoalExecutionWorkflowStatus;
  budgetAmount?: number;
  budgetCurrency?: string;
  budgetSpent?: number;
  resources?: string[];
  startDate?: string;
  endDate?: string;
  metadata?: GoalExecutionMetadata;
  forceStatus?: boolean;
}

export interface GoalExecutionInitiativesDependencies {
  repository: GoalExecutionRepository;
  workflow: GoalExecutionWorkflow;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-init-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Executable initiatives linked to goals and objectives.
 */
export class GoalExecutionInitiatives {
  private readonly repository: GoalExecutionRepository;
  private readonly workflow: GoalExecutionWorkflow;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionInitiativesDependencies) {
    this.repository = dependencies.repository;
    this.workflow = dependencies.workflow;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  async create(input: CreateExecutionInitiativeInput): Promise<ExecutionInitiative> {
    const timestamp = this.now().toISOString();
    const initiative: ExecutionInitiative = {
      id: input.id ?? this.createId(),
      goalId: input.goalId,
      objectiveIds: Object.freeze([...(input.objectiveIds ?? [])]),
      title: input.title,
      description: input.description,
      status: input.status ?? "draft",
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency ?? "USD",
      budgetSpent: input.budgetSpent ?? 0,
      resources: Object.freeze([...(input.resources ?? [])]),
      startDate: input.startDate,
      endDate: input.endDate,
      strategicInitiativeId: input.strategicInitiativeId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: { ...(input.metadata ?? {}) },
    };
    return this.repository.saveInitiative(initiative);
  }

  async update(
    id: string,
    patch: UpdateExecutionInitiativeInput
  ): Promise<ExecutionInitiative> {
    const existing = await this.repository.findInitiative(id);
    if (!existing) {
      throw new Error(`Execution initiative not found: ${id}`);
    }
    const nextStatus =
      patch.status !== undefined
        ? this.workflow.transition(existing.status, patch.status, {
            force: patch.forceStatus,
          })
        : existing.status;

    const updated: ExecutionInitiative = {
      ...existing,
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      objectiveIds:
        patch.objectiveIds !== undefined
          ? Object.freeze([...patch.objectiveIds])
          : existing.objectiveIds,
      status: nextStatus,
      budgetAmount: patch.budgetAmount ?? existing.budgetAmount,
      budgetCurrency: patch.budgetCurrency ?? existing.budgetCurrency,
      budgetSpent: patch.budgetSpent ?? existing.budgetSpent,
      resources:
        patch.resources !== undefined
          ? Object.freeze([...patch.resources])
          : existing.resources,
      startDate: patch.startDate ?? existing.startDate,
      endDate: patch.endDate ?? existing.endDate,
      metadata: patch.metadata !== undefined ? { ...patch.metadata } : existing.metadata,
      updatedAt: this.now().toISOString(),
    };
    return this.repository.saveInitiative(updated);
  }

  async get(id: string): Promise<ExecutionInitiative | null> {
    return this.repository.findInitiative(id);
  }

  async list(filter?: { goalId?: string }): Promise<ExecutionInitiative[]> {
    return this.repository.listInitiatives(filter);
  }
}
