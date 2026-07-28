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
      bills: engine.listBills(gate.organizationId),
      aging: engine.aging(gate.organizationId),
      form1099: engine.vendor1099Ytd(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "approve" | "debit_memo" | "statement";
    vendorId?: string;
    amount?: number;
    billId?: string;
    dueAt?: string;
    recurring?: boolean;
    credit?: boolean;
    memo?: string;
    periodKey?: string;
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
  const engine = createPayablesEngine();

  if (body.action === "approve") {
    const bill = engine.approveBill({
      organizationId: gate.organizationId,
      userId,
      billId: body.billId ?? "",
    });
    if ("error" in bill) return jsonError(JagErrors.validation(bill.error));
    return jsonOk({ bill }, { correlationId: gate.correlationId });
  }
  if (body.action === "debit_memo") {
    const memo = engine.createDebitMemo({
      organizationId: gate.organizationId,
      userId,
      vendorId: body.vendorId ?? "",
      amount: body.amount ?? 0,
      memo: body.memo ?? "Debit memo",
    });
    if ("error" in memo) return jsonError(JagErrors.validation(memo.error));
    return jsonOk(
      { debitMemo: memo },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "statement") {
    const statement = engine.vendorStatement({
      organizationId: gate.organizationId,
      vendorId: body.vendorId ?? "",
      periodKey: body.periodKey ?? new Date().toISOString().slice(0, 7),
    });
    return jsonOk({ statement }, { correlationId: gate.correlationId });
  }

  const bill = engine.createBill({
    organizationId: gate.organizationId,
    userId,
    vendorId: body.vendorId ?? "",
    amount: body.amount ?? 0,
    dueAt: body.dueAt,
    recurring: body.recurring,
    credit: body.credit,
  });
  if ("error" in bill) return jsonError(JagErrors.validation(bill.error));
  return jsonOk(
    { bill },
    { correlationId: gate.correlationId, status: 201 }
  );
}
