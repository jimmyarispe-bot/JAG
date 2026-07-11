/**
 * Accounting Intelligence — Allocations.
 *
 * Allocate costs across department, campus, program, grant, scholarship,
 * cost center, square footage, headcount, enrollment, or custom bases.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type {
  AccountingAllocation,
  AccountingAllocationBase,
  AccountingAllocationTarget,
  AccountingDimensionalContext,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingAllocationsDependencies {
  posting: AccountingPosting;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateAllocationInput {
  name: string;
  base: AccountingAllocationBase;
  sourceAccountId: string;
  /** Destination expense/asset account receiving allocated amounts. */
  destinationAccountId: string;
  amount: number;
  currency?: string;
  targets: Array<{
    targetId: string;
    label: string;
    weight: number;
    dimensions?: AccountingDimensionalContext;
  }>;
  periodId: string;
  dimensions?: AccountingDimensionalContext;
  actorId?: string | null;
  metadata?: AccountingMetadata;
}

export class AccountingAllocations {
  private readonly allocations = new Map<string, AccountingAllocation>();
  private readonly posting: AccountingPosting;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingAllocationsDependencies) {
    this.posting = deps.posting;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  create(input: CreateAllocationInput): AccountingAllocation {
    if (input.amount <= 0) {
      throw new Error("Allocation amount must be positive");
    }
    if (input.targets.length === 0) {
      throw new Error("Allocation requires at least one target");
    }
    const totalWeight = input.targets.reduce((s, t) => s + t.weight, 0);
    if (totalWeight <= 0) {
      throw new Error("Allocation target weights must sum to a positive value");
    }

    const dimensions = input.dimensions ?? emptyDimensions();
    const targets: AccountingAllocationTarget[] = input.targets.map((t) => ({
      targetId: t.targetId,
      label: t.label,
      weight: t.weight,
      dimensions: t.dimensions ?? emptyDimensions({
        ...dimensions,
        departmentId:
          input.base === "department" ? t.targetId : dimensions.departmentId,
        campusId: input.base === "campus" ? t.targetId : dimensions.campusId,
        programId: input.base === "program" ? t.targetId : dimensions.programId,
        grantId: input.base === "grant" ? t.targetId : dimensions.grantId,
        scholarshipId:
          input.base === "scholarship"
            ? t.targetId
            : dimensions.scholarshipId,
      }),
    }));

    // Credit source (reduce pool), debit destinations by weight
    const shares = this.computeShares(input.amount, targets);
    const lines = [
      {
        accountId: input.sourceAccountId,
        debit: 0,
        credit: input.amount,
        memo: `Allocate from: ${input.name}`,
        dimensions,
      },
      ...targets.map((t, i) => ({
        accountId: input.destinationAccountId,
        debit: shares[i],
        credit: 0,
        memo: `Allocate to ${t.label}`,
        dimensions: t.dimensions,
      })),
    ];

    const draft = this.posting.draftJournal({
      journalType: "allocation",
      periodId: input.periodId,
      memo: `Allocation (${input.base}): ${input.name}`,
      currency: input.currency ?? "USD",
      dimensions,
      createdBy: input.actorId,
      lines,
    });
    const posted = this.posting.postJournal(draft.id, {
      actorId: input.actorId,
      skipDuplicateCheck: true,
    });

    const allocation: AccountingAllocation = {
      id: this.createId("alloc"),
      name: input.name,
      base: input.base,
      sourceAccountId: input.sourceAccountId,
      amount: input.amount,
      currency: input.currency ?? "USD",
      targets,
      periodId: input.periodId,
      journalId: posted.id,
      dimensions,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.allocations.set(allocation.id, allocation);

    this.audit.record({
      kind: "allocation",
      entityId: allocation.id,
      entityType: "AccountingAllocation",
      action: "create",
      actorId: input.actorId,
      dimensions,
      details: { base: input.base, journalId: posted.id },
    });

    return allocation;
  }

  get(id: string): AccountingAllocation | undefined {
    return this.allocations.get(id);
  }

  list(base?: AccountingAllocationBase): AccountingAllocation[] {
    const all = [...this.allocations.values()];
    return base ? all.filter((a) => a.base === base) : all;
  }

  private computeShares(
    amount: number,
    targets: readonly AccountingAllocationTarget[]
  ): number[] {
    const totalWeight = targets.reduce((s, t) => s + t.weight, 0);
    const shares = targets.map(
      (t) => Math.round(((amount * t.weight) / totalWeight) * 100) / 100
    );
    const sum = shares.reduce((s, v) => s + v, 0);
    const diff = Math.round((amount - sum) * 100) / 100;
    shares[shares.length - 1] =
      Math.round((shares[shares.length - 1] + diff) * 100) / 100;
    return shares;
  }
}

export function createAccountingAllocations(
  deps: AccountingAllocationsDependencies
): AccountingAllocations {
  return new AccountingAllocations(deps);
}
