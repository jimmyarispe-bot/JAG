/**
 * Accounting Intelligence — Accruals.
 *
 * Revenue, expense, interest, payroll, grant accruals with automatic reversals.
 * Posts through AccountingPosting → Finance GL.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type {
  AccountingAccrual,
  AccountingAccrualKind,
  AccountingDimensionalContext,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingAccrualsDependencies {
  posting: AccountingPosting;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateAccrualInput {
  kind: AccountingAccrualKind;
  description: string;
  amount: number;
  currency?: string;
  debitAccountId: string;
  creditAccountId: string;
  periodId: string;
  autoReverse?: boolean;
  dimensions?: AccountingDimensionalContext;
  actorId?: string | null;
  metadata?: AccountingMetadata;
}

export class AccountingAccruals {
  private readonly accruals = new Map<string, AccountingAccrual>();
  private readonly posting: AccountingPosting;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingAccrualsDependencies) {
    this.posting = deps.posting;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  create(input: CreateAccrualInput): AccountingAccrual {
    if (input.amount <= 0) {
      throw new Error("Accrual amount must be positive");
    }

    const dimensions = input.dimensions ?? emptyDimensions();
    const draft = this.posting.draftJournal({
      journalType: "adjustment",
      periodId: input.periodId,
      memo: `Accrual (${input.kind}): ${input.description}`,
      currency: input.currency ?? "USD",
      dimensions,
      createdBy: input.actorId,
      lines: [
        {
          accountId: input.debitAccountId,
          debit: input.amount,
          credit: 0,
          memo: input.description,
        },
        {
          accountId: input.creditAccountId,
          debit: 0,
          credit: input.amount,
          memo: input.description,
        },
      ],
    });
    const posted = this.posting.postJournal(draft.id, {
      actorId: input.actorId,
      skipDuplicateCheck: true,
    });

    const accrual: AccountingAccrual = {
      id: this.createId("accrual"),
      kind: input.kind,
      description: input.description,
      amount: input.amount,
      currency: input.currency ?? "USD",
      debitAccountId: input.debitAccountId,
      creditAccountId: input.creditAccountId,
      periodId: input.periodId,
      autoReverse: input.autoReverse ?? true,
      reversed: false,
      journalId: posted.id,
      reversalJournalId: null,
      dimensions,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.accruals.set(accrual.id, accrual);

    this.audit.record({
      kind: "accrual",
      entityId: accrual.id,
      entityType: "AccountingAccrual",
      action: "create",
      actorId: input.actorId,
      dimensions,
      details: { kind: input.kind, journalId: posted.id },
    });

    return accrual;
  }

  /** Reverse accruals marked autoReverse that have not yet been reversed. */
  autoReverseDue(
    periodId: string,
    actorId?: string | null
  ): AccountingAccrual[] {
    const results: AccountingAccrual[] = [];
    for (const accrual of this.accruals.values()) {
      if (!accrual.autoReverse || accrual.reversed || !accrual.journalId) {
        continue;
      }
      const reversal = this.posting.reverseJournal(
        accrual.journalId,
        `Auto-reversal of accrual ${accrual.id}`,
        { actorId, skipDuplicateCheck: true }
      );
      const updated: AccountingAccrual = {
        ...accrual,
        reversed: true,
        reversalJournalId: reversal.id,
        periodId, // reversal booked into target period context for tracking
      };
      this.accruals.set(accrual.id, updated);
      results.push(updated);

      this.audit.record({
        kind: "accrual",
        entityId: accrual.id,
        entityType: "AccountingAccrual",
        action: "auto_reverse",
        actorId,
        dimensions: accrual.dimensions,
        details: { reversalJournalId: reversal.id, periodId },
      });
    }
    return results;
  }

  get(id: string): AccountingAccrual | undefined {
    return this.accruals.get(id);
  }

  list(kind?: AccountingAccrualKind): AccountingAccrual[] {
    const all = [...this.accruals.values()];
    return kind ? all.filter((a) => a.kind === kind) : all;
  }
}

export function createAccountingAccruals(
  deps: AccountingAccrualsDependencies
): AccountingAccruals {
  return new AccountingAccruals(deps);
}
