import {
  createFinanceEngine,
  createTreasuryEngine,
  type BankingAccountKind,
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
      accounts: engine.listTreasuryAccounts(gate.organizationId),
      kinds: engine.accountKinds,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    name?: string;
    kind?: BankingAccountKind;
    entityId?: string;
    mask?: string;
    connectionId?: string;
    institutionId?: string;
    departmentId?: string;
    programId?: string;
    restricted?: boolean;
    currentBalance?: number;
    availableBalance?: number;
    currency?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "controller"]),
    actorUserId: userId,
  });
  const engine = createTreasuryEngine();
  const account = engine.createTreasuryAccount({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Operating Account",
    kind: body.kind ?? "checking",
    entityId: body.entityId,
    mask: body.mask,
    connectionId: body.connectionId,
    institutionId: body.institutionId,
    departmentId: body.departmentId,
    programId: body.programId,
    restricted: body.restricted,
    currentBalance: body.currentBalance,
    availableBalance: body.availableBalance,
    currency: body.currency as "USD" | undefined,
  });
  if ("error" in account) {
    return jsonError(JagErrors.validation(account.error));
  }
  return jsonOk(
    { account },
    { correlationId: gate.correlationId, status: 201 }
  );
}
