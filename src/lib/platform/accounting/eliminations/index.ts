/**
 * Accounting Intelligence — Intercompany Eliminations.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type {
  AccountingElimination,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingEliminationsDependencies {
  posting: AccountingPosting;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateEliminationInput {
  description: string;
  amount: number;
  currency?: string;
  debitAccountId: string;
  creditAccountId: string;
  entityFromId: string;
  entityToId: string;
  periodId: string;
  actorId?: string | null;
  metadata?: AccountingMetadata;
}

export class AccountingEliminations {
  private readonly items = new Map<string, AccountingElimination>();
  private readonly posting: AccountingPosting;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingEliminationsDependencies) {
    this.posting = deps.posting;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  create(input: CreateEliminationInput): AccountingElimination {
    if (input.amount <= 0) {
      throw new Error("Elimination amount must be positive");
    }
    if (input.entityFromId === input.entityToId) {
      throw new Error("Elimination entities must differ");
    }

    const dimensions = emptyDimensions({
      organizationId: input.entityFromId,
    });

    const draft = this.posting.draftJournal({
      journalType: "intercompany",
      periodId: input.periodId,
      memo: `Elimination: ${input.description}`,
      currency: input.currency ?? "USD",
      dimensions,
      createdBy: input.actorId,
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
      actorId: input.actorId,
      skipDuplicateCheck: true,
    });

    const item: AccountingElimination = {
      id: this.createId("elim"),
      description: input.description,
      amount: input.amount,
      currency: input.currency ?? "USD",
      debitAccountId: input.debitAccountId,
      creditAccountId: input.creditAccountId,
      entityFromId: input.entityFromId,
      entityToId: input.entityToId,
      periodId: input.periodId,
      journalId: posted.id,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.items.set(item.id, item);

    this.audit.record({
      kind: "elimination",
      entityId: item.id,
      entityType: "AccountingElimination",
      action: "create",
      actorId: input.actorId,
      dimensions,
      details: { journalId: posted.id },
    });

    return item;
  }

  get(id: string): AccountingElimination | undefined {
    return this.items.get(id);
  }

  list(periodId?: string): AccountingElimination[] {
    const all = [...this.items.values()];
    return periodId ? all.filter((e) => e.periodId === periodId) : all;
  }
}

export function createAccountingEliminations(
  deps: AccountingEliminationsDependencies
): AccountingEliminations {
  return new AccountingEliminations(deps);
}
