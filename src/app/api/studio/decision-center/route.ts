import {
  createDecisionCenterService,
  type RecommendationSort,
} from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const sort =
    (searchParams.get("sort") as RecommendationSort | null) ?? "highest_impact";
  const productId = searchParams.get("productId") ?? "academyos";
  return jsonOk(
    {
      decisionCenter: createDecisionCenterService().build({
        sort,
        productId,
      }),
    },
    { correlationId: gate.correlationId }
  );
}
