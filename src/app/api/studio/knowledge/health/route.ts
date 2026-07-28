import { buildGraphHealthReport, buildKnowledgeDashboard } from "@studio";
import { jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? "academyos";
  if (searchParams.get("dashboard") === "1") {
    return jsonOk(
      { dashboard: buildKnowledgeDashboard() },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    { health: buildGraphHealthReport({ productId }) },
    { correlationId: gate.correlationId }
  );
}
