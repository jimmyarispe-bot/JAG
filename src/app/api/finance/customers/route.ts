import { createFinanceEngine, type CustomerKind } from "@finance";
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
    { customers: engine.listCustomers(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    name?: string;
    kind?: CustomerKind;
    paymentTerms?: string;
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
  const customer = engine.createCustomer({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Customer",
    kind: body.kind ?? "organization",
    paymentTerms: body.paymentTerms,
  });
  if ("error" in customer) {
    return jsonError(JagErrors.validation(customer.error));
  }
  return jsonOk(
    { customer },
    { correlationId: gate.correlationId, status: 201 }
  );
}
