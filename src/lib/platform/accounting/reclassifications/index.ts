/**
 * Accounting Intelligence — Reclassifications.
 *
 * Department, account, grant, campus, program reclasses with required reason
 * and full audit trail.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type {
  AccountingDimensionalContext,
  AccountingMetadata,
  AccountingReclassification,
  AccountingReclassScope,
} from "@/lib/platform/accounting/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingReclassificationsDependencies {
  posting: AccountingPosting;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateReclassificationInput {
  scope: AccountingReclassScope;
  reason: string;
  amount: number;
  currency?: string;
  fromAccountId: string;
  toAccountId: string;
  fromDimensions?: AccountingDimensionalContext;
  toDimensions?: AccountingDimensionalContext;
  periodId: string;
  evidenceRef?: string | null;
  approvalRef?: string | null;
  createdBy?: string | null;
  metadata?: AccountingMetadata;
}

export class AccountingReclassifications {
  private readonly items = new Map<string, AccountingReclassification>();
  private readonly posting: AccountingPosting;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingReclassificationsDependencies) {
    this.posting = deps.posting;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  create(input: CreateReclassificationInput): AccountingReclassification {
    if (!input.reason.trim()) {
      throw new Error("Reason is required for reclassifications");
    }
    if (input.amount <= 0) {
      throw new Error("Reclassification amount must be positive");
    }

    const fromDimensions = input.fromDimensions ?? emptyDimensions();
    const toDimensions = input.toDimensions ?? emptyDimensions();

    const draft = this.posting.draftJournal({
      journalType: "reclassification",
      periodId: input.periodId,
      memo: `Reclass (${input.scope}): ${input.reason}`,
      currency: input.currency ?? "USD",
      dimensions: fromDimensions,
      reason: input.reason,
      evidenceRef: input.evidenceRef,
      approvalRef: input.approvalRef,
      createdBy: input.createdBy,
      lines: [
        {
          accountId: input.toAccountId,
          debit: input.amount,
          credit: 0,
          dimensions: toDimensions,
          memo: `Reclass to (${input.scope})`,
        },
        {
          accountId: input.fromAccountId,
          debit: 0,
          credit: input.amount,
          dimensions: fromDimensions,
          memo: `Reclass from (${input.scope})`,
        },
      ],
    });
    const posted = this.posting.postJournal(draft.id, {
      actorId: input.createdBy,
      skipDuplicateCheck: true,
    });

    const item: AccountingReclassification = {
      id: this.createId("reclass"),
      scope: input.scope,
      reason: input.reason,
      amount: input.amount,
      currency: input.currency ?? "USD",
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      fromDimensions,
      toDimensions,
      periodId: input.periodId,
      journalId: posted.id,
      evidenceRef: input.evidenceRef ?? null,
      approvalRef: input.approvalRef ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.items.set(item.id, item);

    this.audit.record({
      kind: "reclassification",
      entityId: item.id,
      entityType: "AccountingReclassification",
      action: "create",
      actorId: input.createdBy,
      reason: input.reason,
      evidenceRef: input.evidenceRef,
      approvalRef: input.approvalRef,
      dimensions: fromDimensions,
      details: { scope: input.scope, journalId: posted.id },
    });

    return item;
  }

  get(id: string): AccountingReclassification | undefined {
    return this.items.get(id);
  }

  list(scope?: AccountingReclassScope): AccountingReclassification[] {
    const all = [...this.items.values()];
    return scope ? all.filter((r) => r.scope === scope) : all;
  }
}

export function createAccountingReclassifications(
  deps: AccountingReclassificationsDependencies
): AccountingReclassifications {
  return new AccountingReclassifications(deps);
}
