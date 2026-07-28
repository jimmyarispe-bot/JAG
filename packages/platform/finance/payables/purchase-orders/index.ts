import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import { attachFinanceDocument } from "../../attachments";
import { listVendors } from "../../store";
import {
  getOrder,
  listOrders,
  listRequests,
  upsertOrder,
  upsertRequest,
} from "../store";
import type { PurchaseOrder, PurchaseOrderLine } from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function createPurchaseOrder(input: {
  organizationId: string;
  userId: string;
  vendorId: string;
  lines: readonly { description: string; quantity: number; unitCost: number }[];
  purchaseRequestId?: string | null;
  currency?: string;
}): PurchaseOrder | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (!listVendors(input.organizationId).some((v) => v.id === input.vendorId)) {
    return { error: "Vendor not found." };
  }
  if (!input.lines.length) return { error: "At least one line is required." };

  const lines: PurchaseOrderLine[] = input.lines.map((l) =>
    Object.freeze({
      id: `pol:${randomUUID()}`,
      description: l.description,
      quantity: l.quantity,
      unitCost: l.unitCost,
      receivedQuantity: 0,
    })
  );
  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  if (input.purchaseRequestId) {
    const pr = listRequests(input.organizationId).find(
      (r) => r.id === input.purchaseRequestId
    );
    if (!pr) return { error: "Purchase request not found." };
    upsertRequest({ ...pr, status: "converted" });
  }

  const order = upsertOrder({
    id: `po:${randomUUID()}`,
    organizationId: input.organizationId,
    vendorId: input.vendorId,
    purchaseRequestId: input.purchaseRequestId ?? null,
    status: "pending_approval",
    lines: Object.freeze(lines),
    currency: (input.currency as PurchaseOrder["currency"]) ?? "USD",
    total,
    approvedBy: null,
    createdBy: input.userId,
    createdAt: new Date().toISOString(),
    attachmentIds: Object.freeze([]),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "purchasing.po_create",
    recordType: "purchase_order",
    recordId: order.id,
    userId: input.userId,
    newValue: order,
  });
  publishOperationalFinanceEvent({
    type: "finance.purchase_order_created",
    organizationId: input.organizationId,
    recordType: "purchase_order",
    recordId: order.id,
    actorUserId: input.userId,
    payload: { total: order.total, vendorId: order.vendorId },
  });
  return order;
}

export function attachToPurchaseOrder(input: {
  organizationId: string;
  userId: string;
  purchaseOrderId: string;
  fileName: string;
}): PurchaseOrder | { error: string } {
  const order = getOrder(input.purchaseOrderId);
  if (!order || order.organizationId !== input.organizationId) {
    return { error: "Purchase order not found." };
  }
  const att = attachFinanceDocument({
    organizationId: input.organizationId,
    userId: input.userId,
    kind: "supporting",
    fileName: input.fileName,
    contentType: "application/octet-stream",
    linkedRecordType: "purchase_order",
    linkedRecordId: order.id,
  });
  if ("error" in att) return att;
  return upsertOrder({
    ...order,
    attachmentIds: Object.freeze([...order.attachmentIds, att.id]),
  });
}

export { listOrders, getOrder };
