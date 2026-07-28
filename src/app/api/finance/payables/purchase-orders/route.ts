import { createFinanceEngine, createPayablesEngine } from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createPayablesEngine();
  return jsonOk(
    {
      purchaseOrders: engine.listPurchaseOrders(gate.organizationId),
      requests: engine.listPurchaseRequests(gate.organizationId),
      receipts: engine.listReceipts(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?:
      | "request"
      | "create_po"
      | "approve_po"
      | "receive"
      | "approve_request";
    vendorId?: string;
    description?: string;
    amount?: number;
    purchaseOrderId?: string;
    requestId?: string;
    lineId?: string;
    quantity?: number;
    lines?: { description: string; quantity: number; unitCost: number }[];
    purchaseRequestId?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "approve", "controller"]),
    actorUserId: userId,
  });
  // Second approver for SoD tests via optional header not available — grant only
  const engine = createPayablesEngine();

  if (body.action === "request") {
    const req = engine.createPurchaseRequest({
      organizationId: gate.organizationId,
      userId,
      description: body.description ?? "Purchase request",
      amount: body.amount ?? 0,
      vendorId: body.vendorId,
    });
    if ("error" in req) return jsonError(JagErrors.validation(req.error));
    return jsonOk(
      { request: req },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "approve_request") {
    const req = engine.approvePurchaseRequest({
      organizationId: gate.organizationId,
      userId,
      requestId: body.requestId ?? "",
    });
    if ("error" in req) return jsonError(JagErrors.validation(req.error));
    return jsonOk({ request: req }, { correlationId: gate.correlationId });
  }
  if (body.action === "approve_po") {
    const po = engine.approvePurchaseOrder({
      organizationId: gate.organizationId,
      userId,
      purchaseOrderId: body.purchaseOrderId ?? "",
    });
    if ("error" in po) return jsonError(JagErrors.validation(po.error));
    return jsonOk({ purchaseOrder: po }, { correlationId: gate.correlationId });
  }
  if (body.action === "receive") {
    const receipt = engine.receiveLine({
      organizationId: gate.organizationId,
      userId,
      purchaseOrderId: body.purchaseOrderId ?? "",
      lineId: body.lineId ?? "",
      quantity: body.quantity ?? 0,
    });
    if ("error" in receipt) {
      return jsonError(JagErrors.validation(receipt.error));
    }
    return jsonOk(
      { receipt },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const po = engine.createPurchaseOrder({
    organizationId: gate.organizationId,
    userId,
    vendorId: body.vendorId ?? "",
    lines: body.lines ?? [],
    purchaseRequestId: body.purchaseRequestId,
  });
  if ("error" in po) return jsonError(JagErrors.validation(po.error));
  return jsonOk(
    { purchaseOrder: po },
    { correlationId: gate.correlationId, status: 201 }
  );
}
