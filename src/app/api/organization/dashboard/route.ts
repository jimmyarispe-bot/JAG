import { createUniversalOrganizationEngine } from "@organization";
import { jsonError, jsonOk, JagErrors, requireOrgModelOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireOrgModelOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();
  const dashboard = engine.dashboard(gate.organizationId);
  if ("error" in dashboard) {
    return jsonError(JagErrors.validation(dashboard.error));
  }
  return jsonOk(
    {
      dashboard,
      profiles: engine.listProfiles().map((p) =>
        Object.freeze({ id: p.id, title: p.title })
      ),
      financeRoadmapNote:
        "JAG Finance™ / JAG CFO™ follows Universal Organization Model as a multi-sprint initiative.",
    },
    { correlationId: gate.correlationId }
  );
}
