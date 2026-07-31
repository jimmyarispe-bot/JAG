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
      dashboard: engine.dashboard(gate.organizationId),
      knowledge: engine.knowledge(gate.organizationId),
      guards: engine.guards,
    },
    { correlationId: gate.correlationId }
  );
}
