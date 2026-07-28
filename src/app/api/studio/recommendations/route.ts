import { createRecommendationEngine } from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const report = createRecommendationEngine().generate({
    force: searchParams.get("force") === "1",
  });
  const severity = searchParams.get("severity");
  const q = searchParams.get("q")?.trim().toLowerCase();
  let recommendations = [...report.recommendations];
  if (severity) {
    recommendations = recommendations.filter((r) => r.severity === severity);
  }
  if (q) {
    recommendations = recommendations.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q) ||
        r.evidence.some((e) => e.toLowerCase().includes(q))
    );
  }
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? 50))
  );
  const total = recommendations.length;
  const start = (page - 1) * pageSize;

  return jsonOk(
    {
      generatedAt: report.generatedAt,
      countsBySeverity: report.countsBySeverity,
      recommendations: recommendations.slice(start, start + pageSize),
      pagination: { page, pageSize, total },
    },
    { correlationId: gate.correlationId }
  );
}
