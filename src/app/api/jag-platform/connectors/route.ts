import {
  canAccessConnectorOrganization,
  getConnectorFramework,
} from "@/lib/connectors";
import {
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";

export async function GET(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const org = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessConnectorOrganization(gate.session, id),
    gate.correlationId
  );
  if (!org.ok) return org.response;

  const framework = getConnectorFramework();
  return jsonOk(
    {
      catalog: framework.listCatalog(),
      catalogGrouped: framework.listCatalogGrouped(),
      installations: framework.listInstalled(org.organizationId),
      metrics: framework.getMetrics(org.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}
