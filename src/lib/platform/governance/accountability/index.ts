/**
 * Enterprise Governance — accountability.
 *
 * Tracks owner, due dates, completion, evidence, risk, and impact.
 */

import type {
  GovernanceAccountabilityItem,
  GovernanceAccountabilityStatus,
  GovernanceApprovalRequest,
  GovernanceCycleRequest,
} from "@/lib/platform/governance/types";

export interface GovernanceAccountabilityDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceAccountability {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceAccountabilityItem>();

  constructor(dependencies: GovernanceAccountabilityDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  syncFromCycle(
    request: GovernanceCycleRequest,
    approvals: readonly GovernanceApprovalRequest[]
  ): GovernanceAccountabilityItem[] {
    const items: GovernanceAccountabilityItem[] = [];
    const ts = this.now().toISOString();
    const due = new Date(this.now());
    due.setUTCDate(due.getUTCDate() + 30);

    for (const goal of request.executionGoals ?? []) {
      const progress = request.executionProgress?.find(
        (p) => p.subjectId === goal.id
      );
      items.push(
        this.track({
          title: goal.title,
          owner: "executive",
          dueDate: goal.targetDate,
          completionPercent: progress?.completionPercent ?? 0,
          evidenceIds: request.workspaceLinks?.evidenceIds ?? [],
          riskScore: progress?.riskScore ?? 0.4,
          impactScore: 0.7,
          linkedGoalId: goal.id,
          status: this.statusFromProgress(progress?.completionPercent ?? 0),
        })
      );
    }

    for (const approval of approvals) {
      items.push(
        this.track({
          title: `Approve: ${approval.subject}`,
          owner: approval.chain[0]?.label ?? "executive_team",
          dueDate: due.toISOString(),
          completionPercent: approval.status === "approved" ? 100 : 0,
          evidenceIds: [],
          riskScore: approval.domain === "financial" ? 0.7 : 0.4,
          impactScore: 0.8,
          linkedApprovalId: approval.approvalId,
          status: approval.status === "approved" ? "completed" : "open",
        })
      );
    }

    for (const step of request.autonomy?.plan.steps ?? []) {
      items.push(
        this.track({
          title: step.title,
          owner: step.ownerRole,
          dueDate: due.toISOString(),
          completionPercent: 0,
          evidenceIds: [],
          riskScore: 0.45,
          impactScore: 0.6,
          linkedGoalId: request.autonomy?.execution.goal?.id ?? null,
          status: "open",
          createdAt: ts,
        })
      );
    }

    return items;
  }

  track(input: {
    title: string;
    owner: string;
    dueDate: string;
    completionPercent?: number;
    evidenceIds?: readonly string[];
    riskScore?: number;
    impactScore?: number;
    linkedGoalId?: string | null;
    linkedApprovalId?: string | null;
    status?: GovernanceAccountabilityStatus;
    createdAt?: string;
  }): GovernanceAccountabilityItem {
    const ts = this.now().toISOString();
    const item: GovernanceAccountabilityItem = {
      itemId: this.createId("acct"),
      title: input.title,
      owner: input.owner,
      dueDate: input.dueDate,
      status: input.status ?? "open",
      completionPercent: input.completionPercent ?? 0,
      evidenceIds: [...(input.evidenceIds ?? [])],
      riskScore: input.riskScore ?? 0.5,
      impactScore: input.impactScore ?? 0.5,
      linkedGoalId: input.linkedGoalId ?? null,
      linkedApprovalId: input.linkedApprovalId ?? null,
      createdAt: input.createdAt ?? ts,
      updatedAt: ts,
    };
    this.store.set(item.itemId, item);
    return item;
  }

  updateProgress(
    itemId: string,
    completionPercent: number,
    evidenceIds?: readonly string[]
  ): GovernanceAccountabilityItem {
    const existing = this.store.get(itemId);
    if (!existing) throw new Error(`Accountability item not found: ${itemId}`);
    const updated: GovernanceAccountabilityItem = {
      ...existing,
      completionPercent,
      evidenceIds: evidenceIds ? [...evidenceIds] : existing.evidenceIds,
      status: this.statusFromProgress(completionPercent),
      updatedAt: this.now().toISOString(),
    };
    this.store.set(itemId, updated);
    return updated;
  }

  list(): readonly GovernanceAccountabilityItem[] {
    return Array.from(this.store.values());
  }

  private statusFromProgress(
    completionPercent: number
  ): GovernanceAccountabilityStatus {
    if (completionPercent >= 100) return "completed";
    if (completionPercent > 0) return "in_progress";
    return "open";
  }
}
