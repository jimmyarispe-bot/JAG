import {
  createQualityService,
  getQualityWeights,
  setQualityWeights,
  type QualityWeights,
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
  const service = createQualityService();
  const productId = searchParams.get("productId") as StudioProductId | null;
  if (searchParams.get("weights") === "1") {
    return jsonOk(
      { weights: getQualityWeights() },
      { correlationId: gate.correlationId }
    );
  }
  if (productId) {
    return jsonOk(
      { quality: service.score({ productId }) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { scores: service.scoreAll() },
    { correlationId: gate.correlationId }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    weights?: QualityWeights;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.weights) {
    return jsonError(JagErrors.validation("weights are required."));
  }
  const result = setQualityWeights(body.weights);
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }
  return jsonOk({ weights: result }, { correlationId: gate.correlationId });
}
