import {
  createFinanceEngine,
  createRevenueEngine,
  type BillingMode,
} from "@finance";
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
  return jsonOk(
    {
      invoices: engine.listInvoices(gate.organizationId),
      meta: engine.listInvoiceMeta(gate.organizationId),
      recognition: engine.recognitionSummary(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "send" | "bill" | "recognize";
    customerId?: string;
    amount?: number;
    invoiceId?: string;
    mode?: BillingMode;
    contractId?: string;
    subscriptionId?: string;
    fundingSourceId?: string;
    basis?: "cash" | "accrual";
    kind?: "deferred" | "recognized" | "contract" | "grant" | "subscription" | "cash";
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "post", "controller"]),
    actorUserId: userId,
  });
  const engine = createRevenueEngine();

  if (body.action === "send") {
    const inv = engine.sendInvoice({
      organizationId: gate.organizationId,
      userId,
      invoiceId: body.invoiceId ?? "",
    });
    if ("error" in inv) return jsonError(JagErrors.validation(inv.error));
    return jsonOk({ invoice: inv }, { correlationId: gate.correlationId });
  }
  if (body.action === "bill") {
    const inv = engine.billCustomer({
      organizationId: gate.organizationId,
      userId,
      customerId: body.customerId ?? "",
      amount: body.amount ?? 0,
      mode: body.mode ?? "manual",
      contractId: body.contractId,
      subscriptionId: body.subscriptionId,
      fundingSourceId: body.fundingSourceId,
    });
    if ("error" in inv) return jsonError(JagErrors.validation(inv.error));
    return jsonOk(
      { invoice: inv },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "recognize") {
    const entry = engine.recognizeRevenue({
      organizationId: gate.organizationId,
      userId,
      amount: body.amount ?? 0,
      basis: body.basis ?? "accrual",
      kind: body.kind ?? "recognized",
      invoiceId: body.invoiceId,
      contractId: body.contractId,
    });
    if ("error" in entry) return jsonError(JagErrors.validation(entry.error));
    return jsonOk(
      { recognition: entry },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const inv = engine.createInvoice({
    organizationId: gate.organizationId,
    userId,
    customerId: body.customerId ?? "",
    amount: body.amount ?? 0,
    fundingSourceId: body.fundingSourceId,
    contractId: body.contractId,
  });
  if ("error" in inv) return jsonError(JagErrors.validation(inv.error));
  return jsonOk(
    { invoice: inv },
    { correlationId: gate.correlationId, status: 201 }
  );
}
