import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import { listVendors } from "../../store";
import { listRequests, upsertRequest } from "../store";
import type { PurchaseRequest } from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function createPurchaseRequest(input: {
  organizationId: string;
  userId: string;
  description: string;
  amount: number;
  vendorId?: string | null;
  currency?: string;
}): PurchaseRequest | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (input.amount <= 0) return { error: "Amount must be positive." };
  if (
    input.vendorId &&
    !listVendors(input.organizationId).some((v) => v.id === input.vendorId)
  ) {
    return { error: "Vendor not found." };
  }
  const req = upsertRequest({
    id: `preq:${randomUUID()}`,
    organizationId: input.organizationId,
    requesterId: input.userId,
    vendorId: input.vendorId ?? null,
    description: input.description,
    amount: input.amount,
    currency: (input.currency as PurchaseRequest["currency"]) ?? "USD",
    status: "submitted",
    createdAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "purchasing.request_create",
    recordType: "purchase_request",
    recordId: req.id,
    userId: input.userId,
    newValue: req,
  });
  publishOperationalFinanceEvent({
    type: "finance.purchase_request_created",
    organizationId: input.organizationId,
    recordType: "purchase_request",
    recordId: req.id,
    actorUserId: input.userId,
    payload: { amount: req.amount },
  });
  return req;
}

export function approvePurchaseRequest(input: {
  organizationId: string;
  userId: string;
  requestId: string;
}): PurchaseRequest | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const existing = listRequests(input.organizationId).find(
    (r) => r.id === input.requestId
  );
  if (!existing) return { error: "Purchase request not found." };
  if (existing.status !== "submitted") {
    return { error: "Only submitted requests can be approved." };
  }
  return upsertRequest({ ...existing, status: "approved" });
}

export { listRequests };
