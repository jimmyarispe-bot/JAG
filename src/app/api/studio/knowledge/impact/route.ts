import { createKnowledgeImpactService } from "@studio";
import { JagErrors, jsonError, jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("targetId")?.trim() || searchParams.get("target")?.trim();
  if (!targetId) {
    return jsonError(JagErrors.validation("targetId is required."));
  }
  const maxDepth = Math.min(
    6,
    Math.max(1, Number(searchParams.get("maxDepth") ?? 3))
  );
  const impact = createKnowledgeImpactService().analyze({
    targetId,
    maxDepth,
  });
  return jsonOk({ impact }, { correlationId: gate.correlationId });
}
