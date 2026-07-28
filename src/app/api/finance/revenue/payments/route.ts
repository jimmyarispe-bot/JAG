import { createFinanceEngine, createRevenueEngine } from "@finance";
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
  const engine = createRevenueEngine();
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  return jsonOk(
    {
      payments: engine.listPayments(gate.organizationId),
      portal: customerId
        ? engine.customerPortal({
            organizationId: gate.organizationId,
            customerId,
          })
        : null,
      twin: engine.listTwin(gate.organizationId, 20),
      evidence: engine.listEvidence(gate.organizationId, 20),
      memory: engine.listMemory(gate.organizationId, 20),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "receive" | "credit" | "refund" | "write_off";
    invoiceId?: string;
    paymentId?: string;
    customerId?: string;
    amount?: number;
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
  const engine = createRevenueEngine();

  if (body.action === "credit") {
    const credit = engine.issueCreditMemo({
      organizationId: gate.organizationId,
      userId,
      customerId: body.customerId ?? "",
      amount: body.amount ?? 0,
    });
    if ("error" in credit) return jsonError(JagErrors.validation(credit.error));
    return jsonOk(
      { credit },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "refund") {
    const refund = engine.refundPayment({
      organizationId: gate.organizationId,
      userId,
      paymentId: body.paymentId ?? "",
      amount: body.amount,
    });
    if ("error" in refund) return jsonError(JagErrors.validation(refund.error));
    return jsonOk({ refund }, { correlationId: gate.correlationId });
  }
  if (body.action === "write_off") {
    const inv = engine.writeOffInvoice({
      organizationId: gate.organizationId,
      userId,
      invoiceId: body.invoiceId ?? "",
    });
    if ("error" in inv) return jsonError(JagErrors.validation(inv.error));
    return jsonOk({ invoice: inv }, { correlationId: gate.correlationId });
  }

  const payment = engine.receivePayment({
    organizationId: gate.organizationId,
    userId,
    invoiceId: body.invoiceId ?? "",
    amount: body.amount,
  });
  if ("error" in payment) {
    return jsonError(JagErrors.validation(payment.error));
  }
  return jsonOk(
    { payment },
    { correlationId: gate.correlationId, status: 201 }
  );
}
