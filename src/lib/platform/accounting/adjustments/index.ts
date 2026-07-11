/**
 * Accounting Intelligence — Adjusting Entries.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type {
  AccountingAdjustment,
  AccountingDimensionalContext,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingAdjustmentsDependencies {
  posting: AccountingPosting;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateAdjustmentInput {
  description: string;
  reason: string;
  amount: number;
  currency?: string;
  debitAccountId: string;
  creditAccountId: string;
  periodId: string;
  dimensions?: AccountingDimensionalContext;
  evidenceRef?: string | null;
  approvalRef?: string | null;
  createdBy?: string | null;
  allowHardCloseAdjustment?: boolean;
  metadata?: AccountingMetadata;
}

export class AccountingAdjustments {
  private readonly items = new Map<string, AccountingAdjustment>();
  private readonly posting: AccountingPosting;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingAdjustmentsDependencies) {
    this.posting = deps.posting;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  create(input: CreateAdjustmentInput): AccountingAdjustment {
    if (!input.reason.trim()) {
      throw new Error("Reason is required for adjustments");
    }
    if (input.amount <= 0) {
      throw new Error("Adjustment amount must be positive");
    }

    const dimensions = input.dimensions ?? emptyDimensions();
    const draft = this.posting.draftJournal({
      journalType: "adjustment",
      periodId: input.periodId,
      memo: input.description,
      currency: input.currency ?? "USD",
      dimensions,
      reason: input.reason,
      evidenceRef: input.evidenceRef,
      approvalRef: input.approvalRef,
      createdBy: input.createdBy,
      lines: [
        {
          accountId: input.debitAccountId,
          debit: input.amount,
          credit: 0,
        },
        {
          accountId: input.creditAccountId,
          debit: 0,
          credit: input.amount,
        },
      ],
    });
    const posted = this.posting.postJournal(draft.id, {
      actorId: input.createdBy,
      allowHardCloseAdjustment: input.allowHardCloseAdjustment,
      skipDuplicateCheck: true,
    });

    const item: AccountingAdjustment = {
      id: this.createId("adj"),
      description: input.description,
      reason: input.reason,
      amount: input.amount,
      currency: input.currency ?? "USD",
      debitAccountId: input.debitAccountId,
      creditAccountId: input.creditAccountId,
      periodId: input.periodId,
      journalId: posted.id,
      dimensions,
      evidenceRef: input.evidenceRef ?? null,
      approvalRef: input.approvalRef ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.items.set(item.id, item);

    this.audit.record({
      kind: "adjustment",
      entityId: item.id,
      entityType: "AccountingAdjustment",
      action: "create",
      actorId: input.createdBy,
      reason: input.reason,
      evidenceRef: input.evidenceRef,
      approvalRef: input.approvalRef,
      dimensions,
      details: { journalId: posted.id },
    });

    return item;
  }

  get(id: string): AccountingAdjustment | undefined {
    return this.items.get(id);
  }

  list(): AccountingAdjustment[] {
    return [...this.items.values()];
  }
}

export function createAccountingAdjustments(
  deps: AccountingAdjustmentsDependencies
): AccountingAdjustments {
  return new AccountingAdjustments(deps);
}
