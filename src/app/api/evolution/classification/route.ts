import { createEvolutionEngine, EVOLUTION_CLASSIFICATIONS } from "@evolution";
import { installMrJag } from "@mr-jag";
import { jsonError, jsonOk, JagErrors, requireEvolutionOrg, requireEvolutionOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireEvolutionOrg(request);
  if (!gate.ok) return gate.response;
  return jsonOk(
    { classifications: EVOLUTION_CLASSIFICATIONS },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    requestId?: string;
    text?: string;
    persona?: string;
  };
  const gate = await requireEvolutionOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createEvolutionEngine();

  let requestId = body.requestId;
  if (!requestId && body.text) {
    const captured = engine.capture({
      text: body.text,
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      persona: body.persona,
    });
    requestId = captured.requestId;
  }

  const result = engine.classifyOnly({ requestId: requestId ?? "" });
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }
  return jsonOk(
    {
      classification: result.classification,
      understanding: result.understanding,
      architecture: result.architecture,
      repositorySummary: result.repository.summary,
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
