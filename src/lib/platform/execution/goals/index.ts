/**
 * Goal Execution Engine — goals (Sprint 011).
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type { GoalExecutionWorkflow } from "@/lib/platform/execution/workflow";
import {
  DEFAULT_EXECUTION_CONFIDENCE,
  type ExecutionGoal,
  type GoalExecutionMetadata,
  type GoalExecutionPriority,
  type GoalExecutionWorkflowStatus,
} from "@/lib/platform/execution/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

export interface CreateExecutionGoalInput {
  id?: string;
  title: string;
  description: string;
  priority?: GoalExecutionPriority;
  status?: GoalExecutionWorkflowStatus;
  targetDate: string;
  expectedValue: string;
  confidence?: IntelligenceConfidenceScore;
  linkedOpportunityIds?: string[];
  strategicGoalId?: string | null;
  organizationId?: string | null;
  schoolId?: string | null;
  metadata?: GoalExecutionMetadata;
  createdAt?: string;
}

export interface UpdateExecutionGoalInput {
  title?: string;
  description?: string;
  priority?: GoalExecutionPriority;
  status?: GoalExecutionWorkflowStatus;
  targetDate?: string;
  expectedValue?: string;
  confidence?: IntelligenceConfidenceScore;
  linkedOpportunityIds?: string[];
  metadata?: GoalExecutionMetadata;
  forceStatus?: boolean;
}

export interface GoalExecutionGoalsDependencies {
  repository: GoalExecutionRepository;
  workflow: GoalExecutionWorkflow;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create, update, and archive strategic execution goals.
 */
export class GoalExecutionGoals {
  private readonly repository: GoalExecutionRepository;
  private readonly workflow: GoalExecutionWorkflow;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionGoalsDependencies) {
    this.repository = dependencies.repository;
    this.workflow = dependencies.workflow;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  async create(input: CreateExecutionGoalInput): Promise<ExecutionGoal> {
    const timestamp = input.createdAt ?? this.now().toISOString();
    const goal: ExecutionGoal = {
      id: input.id ?? this.createId(),
      title: input.title,
      description: input.description,
      priority: input.priority ?? "medium",
      status: input.status ?? "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
      targetDate: input.targetDate,
      expectedValue: input.expectedValue,
      confidence: input.confidence ?? { ...DEFAULT_EXECUTION_CONFIDENCE, factors: [] },
      linkedOpportunityIds: Object.freeze([...(input.linkedOpportunityIds ?? [])]),
      strategicGoalId: input.strategicGoalId ?? null,
      organizationId: input.organizationId ?? null,
      schoolId: input.schoolId ?? null,
      archived: false,
      metadata: { ...(input.metadata ?? {}) },
    };
    return this.repository.saveGoal(goal);
  }

  async update(id: string, patch: UpdateExecutionGoalInput): Promise<ExecutionGoal> {
    const existing = await this.repository.findGoal(id);
    if (!existing) {
      throw new Error(`Execution goal not found: ${id}`);
    }
    if (existing.archived) {
      throw new Error(`Execution goal is archived and cannot be updated: ${id}`);
    }

    const nextStatus =
      patch.status !== undefined
        ? this.workflow.transition(existing.status, patch.status, {
            force: patch.forceStatus,
          })
        : existing.status;

    const updated: ExecutionGoal = {
      ...existing,
      title: patch.title ?? existing.title,
      description: patch.description ?? existing.description,
      priority: patch.priority ?? existing.priority,
      status: nextStatus,
      targetDate: patch.targetDate ?? existing.targetDate,
      expectedValue: patch.expectedValue ?? existing.expectedValue,
      confidence: patch.confidence ?? existing.confidence,
      linkedOpportunityIds:
        patch.linkedOpportunityIds !== undefined
          ? Object.freeze([...patch.linkedOpportunityIds])
          : existing.linkedOpportunityIds,
      metadata: patch.metadata !== undefined ? { ...patch.metadata } : existing.metadata,
      updatedAt: this.now().toISOString(),
    };

    return this.repository.saveGoal(updated);
  }

  async archive(id: string): Promise<ExecutionGoal> {
    const existing = await this.repository.findGoal(id);
    if (!existing) {
      throw new Error(`Execution goal not found: ${id}`);
    }
    const archived: ExecutionGoal = {
      ...existing,
      archived: true,
      status:
        existing.status === "completed" || existing.status === "cancelled"
          ? existing.status
          : this.workflow.transition(existing.status, "cancelled", { force: true }),
      updatedAt: this.now().toISOString(),
    };
    return this.repository.saveGoal(archived);
  }

  async get(id: string): Promise<ExecutionGoal | null> {
    return this.repository.findGoal(id);
  }

  async list(filter?: {
    organizationId?: string | null;
    includeArchived?: boolean;
  }): Promise<ExecutionGoal[]> {
    return this.repository.listGoals(filter);
  }
}
