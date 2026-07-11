/**
 * Accounting Intelligence — Nonprofit / Fund Accounting.
 *
 * Net asset classes, fund accounting, grant/donor restrictions.
 * Composes Finance grants service when provided — does not duplicate grant logic.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type {
  AccountingFund,
  AccountingMetadata,
  AccountingNetAssetClass,
} from "@/lib/platform/accounting/types";
import type { FinanceGrants } from "@/lib/platform/finance/grants";
import { emptyDimensions } from "@/lib/platform/finance/types";
import type { FinanceDimensionalContext } from "@/lib/platform/finance/types";

export interface AccountingNonprofitDependencies {
  grants?: FinanceGrants;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface CreateFundInput {
  name: string;
  netAssetClass: AccountingNetAssetClass;
  grantId?: string | null;
  donorRestriction?: string | null;
  openingBalance?: number;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: AccountingMetadata;
}

export class AccountingNonprofit {
  private readonly funds = new Map<string, AccountingFund>();
  private readonly grants: FinanceGrants | undefined;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: AccountingNonprofitDependencies) {
    this.grants = deps?.grants;
    this.createId = deps?.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  createFund(input: CreateFundInput): AccountingFund {
    if (
      input.netAssetClass !== "unrestricted" &&
      !input.donorRestriction &&
      !input.grantId
    ) {
      // Restricted funds should document donor restriction or grant link
    }

    const fund: AccountingFund = {
      id: this.createId("fund"),
      name: input.name,
      netAssetClass: input.netAssetClass,
      grantId: input.grantId ?? null,
      donorRestriction: input.donorRestriction ?? null,
      balance: input.openingBalance ?? 0,
      currency: input.currency ?? "USD",
      dimensions: input.dimensions ?? emptyDimensions({
        grantId: input.grantId ?? null,
      }),
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.funds.set(fund.id, fund);
    return fund;
  }

  adjustBalance(fundId: string, delta: number): AccountingFund {
    const fund = this.require(fundId);
    const updated: AccountingFund = {
      ...fund,
      balance: fund.balance + delta,
    };
    this.funds.set(fundId, updated);
    return updated;
  }

  getFund(id: string): AccountingFund | undefined {
    return this.funds.get(id);
  }

  listFunds(netAssetClass?: AccountingNetAssetClass): AccountingFund[] {
    const all = [...this.funds.values()];
    return netAssetClass
      ? all.filter((f) => f.netAssetClass === netAssetClass)
      : all;
  }

  netAssetsByClass(): Record<AccountingNetAssetClass, number> {
    const result: Record<AccountingNetAssetClass, number> = {
      unrestricted: 0,
      temporarily_restricted: 0,
      permanently_restricted: 0,
      restricted: 0,
    };
    for (const fund of this.funds.values()) {
      result[fund.netAssetClass] += fund.balance;
    }
    return result;
  }

  /**
   * Sync fund balances from Finance grants when available (composition).
   */
  syncFromGrants(): AccountingFund[] {
    if (!this.grants) return [];
    const synced: AccountingFund[] = [];
    for (const grant of this.grants.listGrants()) {
      const existing = [...this.funds.values()].find(
        (f) => f.grantId === grant.id
      );
      const netAssetClass: AccountingNetAssetClass =
        grant.restriction === "unrestricted"
          ? "unrestricted"
          : grant.restriction === "temporarily_restricted"
            ? "temporarily_restricted"
            : "restricted";

      if (existing) {
        const updated: AccountingFund = {
          ...existing,
          balance: grant.remainingAmount,
          netAssetClass,
        };
        this.funds.set(existing.id, updated);
        synced.push(updated);
      } else {
        synced.push(
          this.createFund({
            name: grant.name,
            netAssetClass,
            grantId: grant.id,
            donorRestriction: `Grant from ${grant.grantorName}`,
            openingBalance: grant.remainingAmount,
            dimensions: grant.dimensions,
          })
        );
      }
    }
    return synced;
  }

  private require(id: string): AccountingFund {
    const fund = this.funds.get(id);
    if (!fund) throw new Error(`Fund not found: ${id}`);
    return fund;
  }
}

export function createAccountingNonprofit(
  deps?: AccountingNonprofitDependencies
): AccountingNonprofit {
  return new AccountingNonprofit(deps);
}
