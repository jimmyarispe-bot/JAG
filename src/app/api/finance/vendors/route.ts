import { createFinanceEngine } from "@finance";
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
      vendors: engine.listVendors(gate.organizationId),
      form1099: engine.list1099Vendors(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    name?: string;
    paymentTerms?: string;
    is1099?: boolean;
    category?: string;
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
  const vendor = engine.createVendor({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Vendor",
    paymentTerms: body.paymentTerms,
    is1099: body.is1099,
    category: body.category,
  });
  if ("error" in vendor) return jsonError(JagErrors.validation(vendor.error));
  return jsonOk(
    { vendor },
    { correlationId: gate.correlationId, status: 201 }
  );
}
