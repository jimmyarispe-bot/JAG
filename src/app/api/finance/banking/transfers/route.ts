import {
  createFinanceEngine,
  createTreasuryEngine,
  type TreasuryTransferKind,
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
  const engine = createTreasuryEngine();
  return jsonOk(
    {
      transfers: engine.listTransferRequests(gate.organizationId),
      rails: engine.describePaymentRails(),
      policy: engine.getApprovalPolicy(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "request" | "approve" | "execute";
    kind?: TreasuryTransferKind;
    fromBankAccountId?: string;
    toBankAccountId?: string;
    amount?: number;
    memo?: string;
    transferRequestId?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "approve", "post", "controller"]),
    actorUserId: userId,
  });
  const engine = createTreasuryEngine();

  if (body.action === "approve") {
    const transfer = engine.approveTransfer({
      organizationId: gate.organizationId,
      userId,
      transferRequestId: body.transferRequestId ?? "",
    });
    if ("error" in transfer) {
      return jsonError(JagErrors.validation(transfer.error));
    }
    return jsonOk({ transfer }, { correlationId: gate.correlationId });
  }
  if (body.action === "execute") {
    const transfer = engine.executeTransfer({
      organizationId: gate.organizationId,
      userId,
      transferRequestId: body.transferRequestId ?? "",
    });
    if ("error" in transfer) {
      return jsonError(JagErrors.validation(transfer.error));
    }
    return jsonOk({ transfer }, { correlationId: gate.correlationId });
  }

  const transfer = engine.requestTransfer({
    organizationId: gate.organizationId,
    userId,
    kind: body.kind ?? "internal",
    fromBankAccountId: body.fromBankAccountId ?? "",
    toBankAccountId: body.toBankAccountId ?? "",
    amount: body.amount ?? 0,
    memo: body.memo,
  });
  if ("error" in transfer) {
    return jsonError(JagErrors.validation(transfer.error));
  }
  return jsonOk(
    { transfer },
    { correlationId: gate.correlationId, status: 201 }
  );
}
