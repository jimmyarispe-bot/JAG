import {
  createDecisionCenterService,
  type RecommendationSort,
} from "@studio";
import { jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const sort =
    (searchParams.get("sort") as RecommendationSort | null) ?? "highest_impact";
  const productId = searchParams.get("productId") ?? "academyos";
  const recommendations = createDecisionCenterService().recommendations({
    sort,
    productId,
  });
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 40))
  );
  const total = recommendations.length;
  const start = (page - 1) * pageSize;
  return jsonOk(
    {
      recommendations: recommendations.slice(start, start + pageSize),
      pagination: { page, pageSize, total },
      sort,
    },
    { correlationId: gate.correlationId }
  );
}
