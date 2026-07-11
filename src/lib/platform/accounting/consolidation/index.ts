/**
 * Accounting Intelligence — Consolidation.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingEliminations } from "@/lib/platform/accounting/eliminations";
import type {
  AccountingConsolidationEntity,
  AccountingConsolidationResult,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";

export interface AccountingConsolidationDependencies {
  gl: FinanceGeneralLedger;
  eliminations: AccountingEliminations;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class AccountingConsolidation {
  private readonly entities = new Map<string, AccountingConsolidationEntity>();
  private readonly results: AccountingConsolidationResult[] = [];
  private readonly gl: FinanceGeneralLedger;
  private readonly eliminations: AccountingEliminations;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingConsolidationDependencies) {
    this.gl = deps.gl;
    this.eliminations = deps.eliminations;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  addEntity(input: {
    name: string;
    parentEntityId?: string | null;
    ownershipPercent?: number;
    metadata?: AccountingMetadata;
  }): AccountingConsolidationEntity {
    const entity: AccountingConsolidationEntity = {
      id: this.createId("entity"),
      name: input.name,
      parentEntityId: input.parentEntityId ?? null,
      ownershipPercent: input.ownershipPercent ?? 100,
      active: true,
    };
    this.entities.set(entity.id, entity);
    return entity;
  }

  listEntities(): AccountingConsolidationEntity[] {
    return [...this.entities.values()].filter((e) => e.active);
  }

  /**
   * Produce a consolidation snapshot from GL balances + eliminations for a period.
   */
  consolidate(periodId: string): AccountingConsolidationResult {
    const coa = this.gl.chartOfAccounts;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const acct of coa.listAccounts()) {
      const bal = this.gl.getBalance(acct.id).normalBalance;
      if (acct.type === "asset") totalAssets += bal;
      else if (acct.type === "liability") totalLiabilities += bal;
      else if (acct.type === "equity") totalEquity += bal;
    }

    const elims = this.eliminations.list(periodId);
    const entityIds = this.listEntities().map((e) => e.id);

    const result: AccountingConsolidationResult = {
      id: this.createId("consol"),
      periodId,
      entityIds,
      eliminationIds: elims.map((e) => e.id),
      totalAssets,
      totalLiabilities,
      totalEquity,
      currency: "USD",
      generatedAt: this.now().toISOString(),
    };
    this.results.push(result);
    return result;
  }

  listResults(): AccountingConsolidationResult[] {
    return [...this.results];
  }
}

export function createAccountingConsolidation(
  deps: AccountingConsolidationDependencies
): AccountingConsolidation {
  return new AccountingConsolidation(deps);
}
