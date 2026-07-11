/**
 * Accounting Intelligence — Account Reconciliation.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type {
  AccountingMetadata,
  AccountingReconciliation,
  AccountingReconciliationStatus,
} from "@/lib/platform/accounting/types";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";

export interface AccountingReconciliationDependencies {
  gl: FinanceGeneralLedger;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface StartReconciliationInput {
  accountId: string;
  periodId: string;
  externalBalance: number;
  notes?: string;
  metadata?: AccountingMetadata;
}

export class AccountingReconciliationService {
  private readonly items = new Map<string, AccountingReconciliation>();
  private readonly gl: FinanceGeneralLedger;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingReconciliationDependencies) {
    this.gl = deps.gl;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  start(input: StartReconciliationInput): AccountingReconciliation {
    const bookBalance = this.gl.getBalance(input.accountId).normalBalance;
    const difference =
      Math.round((bookBalance - input.externalBalance) * 100) / 100;

    const item: AccountingReconciliation = {
      id: this.createId("recon"),
      accountId: input.accountId,
      periodId: input.periodId,
      status: Math.abs(difference) < 0.01 ? "reconciled" : "in_progress",
      bookBalance,
      externalBalance: input.externalBalance,
      difference,
      notes: input.notes ?? "",
      reconciledBy: null,
      reconciledAt:
        Math.abs(difference) < 0.01 ? this.now().toISOString() : null,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.items.set(item.id, item);

    this.audit.record({
      kind: "reconciliation",
      entityId: item.id,
      entityType: "AccountingReconciliation",
      action: "start",
      details: {
        accountId: input.accountId,
        difference,
        status: item.status,
      },
    });

    return item;
  }

  markReconciled(
    id: string,
    actorId: string,
    notes?: string
  ): AccountingReconciliation {
    const item = this.require(id);
    if (Math.abs(item.difference) >= 0.01) {
      throw new Error(
        `Cannot mark reconciled with difference ${item.difference}`
      );
    }
    const updated: AccountingReconciliation = {
      ...item,
      status: "reconciled",
      reconciledBy: actorId,
      reconciledAt: this.now().toISOString(),
      notes: notes ?? item.notes,
    };
    this.items.set(id, updated);
    this.audit.record({
      kind: "reconciliation",
      entityId: id,
      entityType: "AccountingReconciliation",
      action: "reconcile",
      actorId,
    });
    return updated;
  }

  flagException(id: string, notes: string): AccountingReconciliation {
    const item = this.require(id);
    const updated: AccountingReconciliation = {
      ...item,
      status: "exception",
      notes,
    };
    this.items.set(id, updated);
    return updated;
  }

  get(id: string): AccountingReconciliation | undefined {
    return this.items.get(id);
  }

  list(filter?: {
    periodId?: string;
    status?: AccountingReconciliationStatus;
  }): AccountingReconciliation[] {
    let list = [...this.items.values()];
    if (filter?.periodId) {
      list = list.filter((r) => r.periodId === filter.periodId);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    return list;
  }

  private require(id: string): AccountingReconciliation {
    const item = this.items.get(id);
    if (!item) throw new Error(`Reconciliation not found: ${id}`);
    return item;
  }
}

export function createAccountingReconciliation(
  deps: AccountingReconciliationDependencies
): AccountingReconciliationService {
  return new AccountingReconciliationService(deps);
}
