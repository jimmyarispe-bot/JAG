import { requireFinancePermission } from "../../permissions";
import { recordFinanceAudit } from "../../audit";
import { getOrder, upsertOrder } from "../store";
import type { PurchaseOrder } from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function approvePurchaseOrder(input: {
  organizationId: string;
  userId: string;
  purchaseOrderId: string;
}): PurchaseOrder | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const order = getOrder(input.purchaseOrderId);
  if (!order || order.organizationId !== input.organizationId) {
    return { error: "Purchase order not found." };
  }
  if (order.status !== "pending_approval" && order.status !== "draft") {
    return { error: "PO is not awaiting approval." };
  }
  if (order.createdBy === input.userId) {
    return {
      error: "Segregation of duties: creator cannot approve their own PO.",
    };
  }
  const next = upsertOrder({
    ...order,
    status: "approved",
    approvedBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "purchasing.po_approve",
    recordType: "purchase_order",
    recordId: next.id,
    userId: input.userId,
    previousValue: { status: order.status },
    newValue: { status: next.status },
    approval: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.purchase_order_approved",
    organizationId: input.organizationId,
    recordType: "purchase_order",
    recordId: next.id,
    actorUserId: input.userId,
  });
  return next;
}
