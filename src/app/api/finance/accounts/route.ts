import {
  createFinanceEngine,
  type AccountType,
  type CoaTemplateId,
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
  const { searchParams } = new URL(request.url);
  if (searchParams.get("templates") === "1") {
    return jsonOk(
      { templates: engine.listCoaTemplates() },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { accounts: engine.listAccounts(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "seed" | "create" | "deactivate";
    templateId?: CoaTemplateId;
    entityId?: string;
    number?: string;
    name?: string;
    type?: AccountType;
    parentAccountId?: string;
    accountId?: string;
    active?: boolean;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  const userId = gate.session.userId;
  engine.grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["controller"]),
    actorUserId: userId,
  });

  if (body.action === "seed") {
    const accounts = engine.seedChartOfAccounts({
      organizationId: gate.organizationId,
      userId,
      templateId: body.templateId ?? "corporate",
      entityId: body.entityId,
    });
    if ("error" in accounts) {
      return jsonError(JagErrors.validation(accounts.error));
    }
    return jsonOk(
      { accounts },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "deactivate" || body.active === false) {
    const account = engine.setAccountActive({
      organizationId: gate.organizationId,
      userId,
      accountId: body.accountId ?? "",
      active: body.active ?? false,
    });
    if ("error" in account) {
      return jsonError(JagErrors.validation(account.error));
    }
    return jsonOk(
      { account },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const account = engine.createAccount({
    organizationId: gate.organizationId,
    userId,
    number: body.number ?? "9999",
    name: body.name ?? "Custom Account",
    type: body.type ?? "expense",
    parentAccountId: body.parentAccountId,
    entityId: body.entityId,
  });
  if ("error" in account) {
    return jsonError(JagErrors.validation(account.error));
  }
  return jsonOk(
    { account },
    { correlationId: gate.correlationId, status: 201 }
  );
}
