import { createKnowledgeRecommendationService } from "@studio";
import { jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? "academyos";
  const severity = searchParams.get("severity");
  const report = createKnowledgeRecommendationService().generate({
    productId,
  });
  let recommendations = [...report.recommendations];
  if (severity) {
    recommendations = recommendations.filter((r) => r.severity === severity);
  }
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 40))
  );
  const total = recommendations.length;
  const start = (page - 1) * pageSize;
  return jsonOk(
    {
      generatedAt: report.generatedAt,
      graphVersion: report.graphVersion,
      countsBySeverity: report.countsBySeverity,
      recommendations: recommendations.slice(start, start + pageSize),
      pagination: { page, pageSize, total },
    },
    { correlationId: gate.correlationId }
  );
}
