import {
  createFinanceEngine,
  createTreasuryEngine,
  type BankTransactionStatus,
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
      transactions: engine.listTransactions(gate.organizationId),
      exceptions: engine.listExceptions(gate.organizationId),
      matches: engine.listMatches(gate.organizationId),
      matching: engine.matchingCapabilities(),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?:
      | "create"
      | "status"
      | "void"
      | "correct"
      | "split"
      | "link"
      | "suggest_match";
    bankAccountId?: string;
    amount?: number;
    direction?: "in" | "out";
    description?: string;
    status?: BankTransactionStatus;
    transactionId?: string;
    merchantName?: string;
    externalId?: string;
    recordType?: string;
    recordId?: string;
    splits?: { amount: number; description: string }[];
    leftType?: "transaction" | "deposit" | "payment" | "invoice" | "bill" | "journal_entry";
    leftId?: string;
    rightType?: "transaction" | "deposit" | "payment" | "invoice" | "bill" | "journal_entry";
    rightId?: string;
    score?: number;
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
  const engine = createTreasuryEngine();

  if (body.action === "status") {
    const txn = engine.setTransactionStatus({
      organizationId: gate.organizationId,
      userId,
      transactionId: body.transactionId ?? "",
      status: body.status ?? "posted",
    });
    if ("error" in txn) return jsonError(JagErrors.validation(txn.error));
    return jsonOk({ transaction: txn }, { correlationId: gate.correlationId });
  }
  if (body.action === "void") {
    const txn = engine.voidTransaction({
      organizationId: gate.organizationId,
      userId,
      transactionId: body.transactionId ?? "",
    });
    if ("error" in txn) return jsonError(JagErrors.validation(txn.error));
    return jsonOk({ transaction: txn }, { correlationId: gate.correlationId });
  }
  if (body.action === "correct") {
    const txn = engine.correctTransaction({
      organizationId: gate.organizationId,
      userId,
      transactionId: body.transactionId ?? "",
      amount: body.amount ?? 0,
      description: body.description,
    });
    if ("error" in txn) return jsonError(JagErrors.validation(txn.error));
    return jsonOk({ transaction: txn }, { correlationId: gate.correlationId });
  }
  if (body.action === "split") {
    const splits = engine.splitTransaction({
      organizationId: gate.organizationId,
      userId,
      transactionId: body.transactionId ?? "",
      splits: body.splits ?? [],
    });
    if ("error" in splits) return jsonError(JagErrors.validation(splits.error));
    return jsonOk({ splits }, { correlationId: gate.correlationId });
  }
  if (body.action === "link") {
    const txn = engine.linkTransaction({
      organizationId: gate.organizationId,
      userId,
      transactionId: body.transactionId ?? "",
      recordType: body.recordType ?? "invoice",
      recordId: body.recordId ?? "",
    });
    if ("error" in txn) return jsonError(JagErrors.validation(txn.error));
    return jsonOk({ transaction: txn }, { correlationId: gate.correlationId });
  }
  if (body.action === "suggest_match") {
    const match = engine.suggestMatch({
      organizationId: gate.organizationId,
      userId,
      leftType: body.leftType ?? "transaction",
      leftId: body.leftId ?? "",
      rightType: body.rightType ?? "invoice",
      rightId: body.rightId ?? "",
      score: body.score ?? 0.8,
    });
    if ("error" in match) return jsonError(JagErrors.validation(match.error));
    return jsonOk(
      { match },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const txn = engine.createTransaction({
    organizationId: gate.organizationId,
    userId,
    bankAccountId: body.bankAccountId ?? "",
    amount: body.amount ?? 0,
    direction: body.direction ?? "out",
    description: body.description ?? "Manual transaction",
    status: body.status,
    merchantName: body.merchantName,
    externalId: body.externalId,
  });
  if ("error" in txn) return jsonError(JagErrors.validation(txn.error));
  return jsonOk(
    { transaction: txn },
    { correlationId: gate.correlationId, status: 201 }
  );
}
