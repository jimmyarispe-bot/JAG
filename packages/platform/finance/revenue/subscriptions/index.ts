import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { listCustomers } from "../../store";
import {
  getContract,
  listSubscriptions,
  upsertSubscription,
} from "../store";
import type { Subscription } from "../types";

export function createSubscription(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  amount: number;
  interval: Subscription["interval"];
  nextBillAt: string;
  contractId?: string | null;
  fundingSourceId?: string | null;
  currency?: string;
}): Subscription | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (
    !listCustomers(input.organizationId).some((c) => c.id === input.customerId)
  ) {
    return { error: "Customer not found." };
  }
  if (input.contractId && !getContract(input.contractId)) {
    return { error: "Contract not found." };
  }
  return upsertSubscription({
    id: `sub:${randomUUID()}`,
    organizationId: input.organizationId,
    customerId: input.customerId,
    contractId: input.contractId ?? null,
    amount: input.amount,
    currency: (input.currency as Subscription["currency"]) ?? "USD",
    interval: input.interval,
    nextBillAt: input.nextBillAt,
    active: true,
    fundingSourceId: input.fundingSourceId ?? null,
  });
}

export { listSubscriptions };
