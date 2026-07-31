import { createEvolutionEngine } from "@evolution";
import { installMrJag } from "@mr-jag";
import { jsonOk, requireEvolutionOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireEvolutionOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createEvolutionEngine();
  return jsonOk(
    {
      priorities: engine.priorities(gate.organizationId),
      analytics: engine.analytics(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}
