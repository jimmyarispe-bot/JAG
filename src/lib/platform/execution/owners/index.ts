/**
 * Goal Execution Engine — owners (Sprint 011).
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import type {
  ExecutionOwners,
  GoalExecutionEntityKind,
  GoalExecutionMetadata,
} from "@/lib/platform/execution/types";

export interface AssignExecutionOwnersInput {
  subjectKind: GoalExecutionEntityKind;
  subjectId: string;
  primaryOwner: string;
  executiveSponsor: string;
  supportingTeam?: string[];
  approver: string;
  metadata?: GoalExecutionMetadata;
}

export interface GoalExecutionOwnersDependencies {
  repository: GoalExecutionRepository;
  now?: () => Date;
}

/**
 * Primary Owner, Executive Sponsor, Supporting Team, Approver.
 */
export class GoalExecutionOwnersService {
  private readonly repository: GoalExecutionRepository;
  private readonly now: () => Date;

  constructor(dependencies: GoalExecutionOwnersDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
  }

  async assign(input: AssignExecutionOwnersInput): Promise<ExecutionOwners> {
    const owners: ExecutionOwners = {
      subjectKind: input.subjectKind,
      subjectId: input.subjectId,
      primaryOwner: input.primaryOwner,
      executiveSponsor: input.executiveSponsor,
      supportingTeam: Object.freeze([...(input.supportingTeam ?? [])]),
      approver: input.approver,
      updatedAt: this.now().toISOString(),
      metadata: { ...(input.metadata ?? {}) },
    };
    return this.repository.saveOwners(owners);
  }

  async get(
    subjectKind: GoalExecutionEntityKind,
    subjectId: string
  ): Promise<ExecutionOwners | null> {
    return this.repository.findOwners(subjectKind, subjectId);
  }

  async list(): Promise<ExecutionOwners[]> {
    return this.repository.listOwners();
  }
}
