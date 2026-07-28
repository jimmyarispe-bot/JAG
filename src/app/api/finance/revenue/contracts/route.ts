import {
  createFinanceEngine,
  createRevenueEngine,
  type ContractKind,
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
      contracts: engine.listContracts(gate.organizationId),
      funding: engine.listFundingSources(gate.organizationId),
      guards: engine.guards,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "seed_funding" | "register_funding";
    customerId?: string;
    name?: string;
    kind?: ContractKind;
    amount?: number;
    startAt?: string;
    endAt?: string;
    fundingSourceId?: string;
    fundingKind?: string;
    fundingName?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "financial_administrator", "controller"]),
    actorUserId: userId,
  });
  const engine = createRevenueEngine();

  if (body.action === "seed_funding") {
    const seeded = engine.seedEducationFundingPresets({
      organizationId: gate.organizationId,
      userId,
    });
    if ("error" in seeded) {
      return jsonError(JagErrors.validation(seeded.error));
    }
    return jsonOk(
      { funding: seeded },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (body.action === "register_funding") {
    const funding = engine.registerFundingSource({
      organizationId: gate.organizationId,
      userId,
      kind: (body.fundingKind as "custom") ?? "custom",
      name: body.fundingName ?? "Custom funding",
    });
    if ("error" in funding) {
      return jsonError(JagErrors.validation(funding.error));
    }
    return jsonOk(
      { funding },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const contract = engine.createContract({
    organizationId: gate.organizationId,
    userId,
    customerId: body.customerId ?? "",
    name: body.name ?? "Contract",
    kind: body.kind ?? "fixed",
    amount: body.amount ?? 0,
    startAt: body.startAt ?? new Date().toISOString(),
    endAt: body.endAt,
    fundingSourceId: body.fundingSourceId,
  });
  if ("error" in contract) {
    return jsonError(JagErrors.validation(contract.error));
  }
  return jsonOk(
    { contract },
    { correlationId: gate.correlationId, status: 201 }
  );
}
