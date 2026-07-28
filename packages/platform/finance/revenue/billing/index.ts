/**
 * Billing facade — manual, recurring, milestone, usage, contract.
 */

import { createRevenueInvoice, billSubscription } from "../invoices";
import { getContract } from "../store";
import type { BillingMode } from "../types";

export function billCustomer(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  amount: number;
  mode: BillingMode;
  contractId?: string | null;
  subscriptionId?: string | null;
  fundingSourceId?: string | null;
  milestoneKey?: string;
  usageUnits?: number;
  usageRate?: number;
  dueAt?: string | null;
}) {
  if (input.mode === "recurring" && input.subscriptionId) {
    return billSubscription({
      organizationId: input.organizationId,
      userId: input.userId,
      subscriptionId: input.subscriptionId,
    });
  }

  let amount = input.amount;
  if (input.mode === "usage") {
    amount = (input.usageUnits ?? 0) * (input.usageRate ?? 0);
  }
  if (input.mode === "milestone" || input.mode === "contract") {
    if (input.contractId) {
      const c = getContract(input.contractId);
      if (!c) return { error: "Contract not found." };
      if (input.mode === "contract" && amount <= 0) amount = c.amount;
    }
  }

  return createRevenueInvoice({
    organizationId: input.organizationId,
    userId: input.userId,
    customerId: input.customerId,
    amount,
    billingMode: input.mode,
    contractId: input.contractId,
    subscriptionId: input.subscriptionId,
    fundingSourceId: input.fundingSourceId,
    dueAt: input.dueAt,
    deferredAmount:
      input.mode === "subscription" || input.mode === "recurring"
        ? amount
        : 0,
  });
}

export { billSubscription };
