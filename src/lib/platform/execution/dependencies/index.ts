/**
 * Goal Execution Engine — dependencies (Sprint 011).
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type {
  ExecutionDependency,
  GoalExecutionDependencyKind,
  GoalExecutionEntityKind,
  GoalExecutionMetadata,
} from "@/lib/platform/execution/types";

export interface CreateExecutionDependencyInput {
  id?: string;
  kind: GoalExecutionDependencyKind;
  fromKind: GoalExecutionEntityKind;
  fromId: string;
  toKind: GoalExecutionEntityKind;
  toId: string;
  metadata?: GoalExecutionMetadata;
}

export interface GoalExecutionDependenciesServiceDependencies {
  repository: GoalExecutionRepository;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-dep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Tracks relationships between goals, objectives, initiatives, and tasks.
 */
export class GoalExecutionDependencies {
  private readonly repository: GoalExecutionRepository;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionDependenciesServiceDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  async link(input: CreateExecutionDependencyInput): Promise<ExecutionDependency> {
    if (input.fromId === input.toId && input.fromKind === input.toKind) {
      throw new Error("Cannot create a self-dependency");
    }
    const dependency: ExecutionDependency = {
      id: input.id ?? this.createId(),
      kind: input.kind,
      fromKind: input.fromKind,
      fromId: input.fromId,
      toKind: input.toKind,
      toId: input.toId,
      createdAt: this.now().toISOString(),
      metadata: { ...(input.metadata ?? {}) },
    };
    return this.repository.saveDependency(dependency);
  }

  async unlink(id: string): Promise<boolean> {
    return this.repository.deleteDependency(id);
  }

  async list(filter?: {
    fromId?: string;
    toId?: string;
  }): Promise<ExecutionDependency[]> {
    return this.repository.listDependencies(filter);
  }

  /**
   * Build a simple adjacency map for downstream graph consumers.
   */
  async adjacency(): Promise<
    ReadonlyMap<string, readonly ExecutionDependency[]>
  > {
    const all = await this.repository.listDependencies();
    const map = new Map<string, ExecutionDependency[]>();
    for (const edge of all) {
      const key = `${edge.fromKind}:${edge.fromId}`;
      const bucket = map.get(key) ?? [];
      bucket.push(edge);
      map.set(key, bucket);
    }
    return map;
  }
}
