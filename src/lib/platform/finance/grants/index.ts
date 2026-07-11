/**
 * Enterprise Financial Intelligence Engine — Grants.
 *
 * Restricted/unrestricted grants, drawdowns, utilization tracking.
 */

import { createFinanceId } from "@/lib/platform/finance/ids";
import type {
  FinanceDimensionalContext,
  FinanceGrant,
  FinanceGrantDrawdown,
  FinanceGrantDrawdownStatus,
  FinanceGrantRestrictionType,
  FinanceGrantStatus,
  FinanceMetadata,
} from "@/lib/platform/finance/types";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AddGrantInput {
  name: string;
  grantorName: string;
  restriction: FinanceGrantRestrictionType;
  totalAmount: number;
  periodStart: string;
  periodEnd: string;
  reimbursementBasis?: boolean;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface RecordDrawdownInput {
  grantId: string;
  requestedAmount: number;
  memo: string;
  currency?: string;
  dimensions?: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface GrantUtilization {
  grantId: string;
  totalAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
  percent: number;
}

export interface FinanceGrantsDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class FinanceGrants {
  private readonly grants = new Map<string, FinanceGrant>();
  private readonly drawdowns = new Map<string, FinanceGrantDrawdown>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private drawdownSequence = 0;

  constructor(deps?: FinanceGrantsDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createFinanceId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  addGrant(input: AddGrantInput): FinanceGrant {
    const id = this.createId("grant");
    const grant: FinanceGrant = {
      id,
      name: input.name,
      grantorName: input.grantorName,
      restriction: input.restriction,
      totalAmount: input.totalAmount,
      utilizedAmount: 0,
      remainingAmount: input.totalAmount,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: "active",
      reimbursementBasis: input.reimbursementBasis ?? false,
      dimensions: input.dimensions ?? emptyDimensions(),
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.grants.set(id, grant);
    return grant;
  }

  getGrant(id: string): FinanceGrant | undefined {
    return this.grants.get(id);
  }

  listGrants(): FinanceGrant[] {
    return [...this.grants.values()].sort((a, b) =>
      a.periodStart.localeCompare(b.periodStart)
    );
  }

  listByStatus(status: FinanceGrantStatus): FinanceGrant[] {
    return this.listGrants().filter((g) => g.status === status);
  }

  updateGrantStatus(grantId: string, status: FinanceGrantStatus): FinanceGrant {
    const grant = this.getGrantOrThrow(grantId);
    const updated: FinanceGrant = { ...grant, status };
    this.grants.set(grantId, updated);
    return updated;
  }

  /** Record a drawdown request against a grant. */
  recordDrawdown(input: RecordDrawdownInput): FinanceGrantDrawdown {
    this.drawdownSequence += 1;
    const grant = this.getGrantOrThrow(input.grantId);
    const id = this.createId("dd");
    const currency = input.currency ?? "USD";

    const drawdown: FinanceGrantDrawdown = {
      id,
      grantId: input.grantId,
      drawdownNumber: `DD-${String(this.drawdownSequence).padStart(5, "0")}`,
      timestamp: this.now().toISOString(),
      dimensions: input.dimensions ?? grant.dimensions,
      amount: { amount: input.requestedAmount, currency },
      memo: input.memo,
      reversedById: null,
      reversesId: null,
      requestedAmount: input.requestedAmount,
      approvedAmount: null,
      currency,
      status: "submitted",
      metadata: input.metadata,
    };
    this.drawdowns.set(id, drawdown);
    return drawdown;
  }

  /** Approve a drawdown and update grant utilization. */
  approveDrawdown(
    drawdownId: string,
    approvedAmount?: number
  ): FinanceGrantDrawdown {
    const dd = this.getDrawdownOrThrow(drawdownId);
    const approved = approvedAmount ?? dd.requestedAmount;
    const updatedDd: FinanceGrantDrawdown = {
      ...dd,
      status: "approved",
      approvedAmount: approved,
    };
    this.drawdowns.set(drawdownId, updatedDd);

    // Update grant utilization
    const grant = this.getGrantOrThrow(dd.grantId);
    const newUtilized = Math.min(
      grant.utilizedAmount + approved,
      grant.totalAmount
    );
    const updated: FinanceGrant = {
      ...grant,
      utilizedAmount: newUtilized,
      remainingAmount: grant.totalAmount - newUtilized,
    };
    this.grants.set(dd.grantId, updated);
    return updatedDd;
  }

  getDrawdown(id: string): FinanceGrantDrawdown | undefined {
    return this.drawdowns.get(id);
  }

  listDrawdowns(grantId?: string): FinanceGrantDrawdown[] {
    const all = [...this.drawdowns.values()].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
    return grantId ? all.filter((d) => d.grantId === grantId) : all;
  }

  getUtilization(grantId: string): GrantUtilization {
    const grant = this.getGrantOrThrow(grantId);
    const percent =
      grant.totalAmount > 0
        ? (grant.utilizedAmount / grant.totalAmount) * 100
        : 0;
    return {
      grantId,
      totalAmount: grant.totalAmount,
      utilizedAmount: grant.utilizedAmount,
      remainingAmount: grant.remainingAmount,
      percent,
    };
  }

  /** Total remaining across all active grants. */
  getTotalAvailableFunding(): number {
    return this.listByStatus("active").reduce(
      (s, g) => s + g.remainingAmount,
      0
    );
  }

  private getGrantOrThrow(id: string): FinanceGrant {
    const g = this.grants.get(id);
    if (!g) throw new Error(`Grant not found: ${id}`);
    return g;
  }

  private getDrawdownOrThrow(id: string): FinanceGrantDrawdown {
    const d = this.drawdowns.get(id);
    if (!d) throw new Error(`Drawdown not found: ${id}`);
    return d;
  }
}

export function createFinanceGrants(
  deps?: FinanceGrantsDependencies
): FinanceGrants {
  return new FinanceGrants(deps);
}
