import { createKnowledgeEngine } from "@knowledge";
import { jsonOk, requireKnowledgeOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireKnowledgeOrg(request);
  if (!gate.ok) return gate.response;
  const url = new URL(request.url);
  const engine = createKnowledgeEngine();
  return jsonOk(
    {
      timeline: engine.buildTimeline({
        organizationId: gate.organizationId,
        documentId: url.searchParams.get("documentId"),
        subjectRef: url.searchParams.get("subjectRef"),
      }),
    },
    { correlationId: gate.correlationId }
  );
}
