import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { recordFinanceAudit } from "../../audit";
import {
  getOrder,
  listReceipts,
  upsertOrder,
  upsertReceipt,
  upsertCredit,
} from "../store";
import type { ReceivingRecord, VendorCredit } from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function receivePurchaseOrderLine(input: {
  organizationId: string;
  userId: string;
  purchaseOrderId: string;
  lineId: string;
  quantity: number;
}): ReceivingRecord | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (input.quantity <= 0) return { error: "Quantity must be positive." };
  const order = getOrder(input.purchaseOrderId);
  if (!order || order.organizationId !== input.organizationId) {
    return { error: "Purchase order not found." };
  }
  if (order.status !== "approved" && order.status !== "partially_received") {
    return { error: "PO must be approved before receiving." };
  }
  const line = order.lines.find((l) => l.id === input.lineId);
  if (!line) return { error: "PO line not found." };
  const remaining = line.quantity - line.receivedQuantity;
  if (input.quantity > remaining) {
    return { error: "Cannot receive more than ordered (backorder remainder)." };
  }
  const newReceived = line.receivedQuantity + input.quantity;
  const lines = order.lines.map((l) =>
    l.id === line.id
      ? Object.freeze({ ...l, receivedQuantity: newReceived })
      : l
  );
  const allReceived = lines.every((l) => l.receivedQuantity >= l.quantity);
  const anyReceived = lines.some((l) => l.receivedQuantity > 0);
  const status = allReceived
    ? "received"
    : anyReceived
      ? "partially_received"
      : order.status;

  upsertOrder({ ...order, lines: Object.freeze(lines), status });
  const receipt = upsertReceipt({
    id: `recv:${randomUUID()}`,
    organizationId: input.organizationId,
    purchaseOrderId: order.id,
    lineId: line.id,
    quantity: input.quantity,
    partial: newReceived < line.quantity,
    receivedAt: new Date().toISOString(),
    receivedBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "purchasing.receive",
    recordType: "receiving",
    recordId: receipt.id,
    userId: input.userId,
    newValue: receipt,
  });
  publishOperationalFinanceEvent({
    type: "finance.goods_received",
    organizationId: input.organizationId,
    recordType: "receiving",
    recordId: receipt.id,
    actorUserId: input.userId,
    payload: {
      purchaseOrderId: order.id,
      quantity: input.quantity,
      partial: receipt.partial,
    },
  });
  return receipt;
}

export function createVendorCredit(input: {
  organizationId: string;
  userId: string;
  vendorId: string;
  amount: number;
  memo: string;
  billId?: string | null;
  currency?: string;
}): VendorCredit | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (input.amount <= 0) return { error: "Credit amount must be positive." };
  return upsertCredit({
    id: `vcred:${randomUUID()}`,
    organizationId: input.organizationId,
    vendorId: input.vendorId,
    amount: input.amount,
    currency: (input.currency as VendorCredit["currency"]) ?? "USD",
    memo: input.memo,
    billId: input.billId ?? null,
    createdAt: new Date().toISOString(),
  });
}

export { listReceipts };
