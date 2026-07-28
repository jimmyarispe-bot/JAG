import { createKnowledgeReasoningService } from "@studio";
import { JagErrors, jsonError, jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const question = searchParams.get("q")?.trim() || searchParams.get("question")?.trim();
  if (!question) {
    return jsonError(JagErrors.validation("q (question) is required."));
  }
  const answer = createKnowledgeReasoningService().reason({
    question,
    productId: searchParams.get("productId") ?? undefined,
  });
  return jsonOk({ reasoning: answer }, { correlationId: gate.correlationId });
}
