import {
  createFinanceEngine,
  type BankingAccountKind,
  type BankStatementImport,
} from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  return jsonOk(
    {
      accounts: engine.listBankAccounts(gate.organizationId),
      imports: engine.listBankImports(gate.organizationId),
      cash: engine.cashBalances(gate.organizationId),
      plaid: engine.plaidInterface(),
      transfers: engine.listTransfers(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "import" | "transfer";
    name?: string;
    kind?: BankingAccountKind;
    entityId?: string;
    mask?: string;
    bankAccountId?: string;
    format?: BankStatementImport["format"];
    fileName?: string;
    rowCount?: number;
    fromBankAccountId?: string;
    toBankAccountId?: string;
    amount?: number;
    memo?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  const userId = gate.session.userId;
  engine.grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "controller"]),
    actorUserId: userId,
  });

  if (body.action === "import") {
    const imp = engine.importBankStatement({
      organizationId: gate.organizationId,
      userId,
      bankAccountId: body.bankAccountId ?? "",
      format: body.format ?? "csv",
      fileName: body.fileName ?? "statement.csv",
      rowCount: body.rowCount,
    });
    if ("error" in imp) return jsonError(JagErrors.validation(imp.error));
    return jsonOk(
      { import: imp },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "transfer") {
    const transfer = engine.transferCash({
      organizationId: gate.organizationId,
      userId,
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

  const account = engine.createBankAccount({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Operating Account",
    kind: body.kind ?? "bank",
    entityId: body.entityId,
    mask: body.mask,
  });
  if ("error" in account) {
    return jsonError(JagErrors.validation(account.error));
  }
  return jsonOk(
    { account },
    { correlationId: gate.correlationId, status: 201 }
  );
}
