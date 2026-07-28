import {
  createPolicyEngine,
  type GovernancePolicy,
  type StudioProductId,
} from "@studio";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireStudioOrg,
  requireStudioOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const engine = createPolicyEngine();
  const productId = searchParams.get("productId") as StudioProductId | null;
  if (productId) {
    return jsonOk(
      { compliance: engine.evaluate({ productId }) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { policies: engine.list() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    policy?: GovernancePolicy;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.policy?.id) {
    return jsonError(JagErrors.validation("policy with id is required."));
  }
  const policy = createPolicyEngine().upsert(body.policy);
  return jsonOk(
    { policy },
    { correlationId: gate.correlationId, status: 201 }
  );
}
