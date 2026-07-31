import { canAccessConnectorOrganization } from "@/lib/connectors";
import {
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";
import { getPlatformSdk } from "@/lib/platform-sdk";

export async function GET(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const orgGate = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessConnectorOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const sdk = getPlatformSdk();
  const snapshot = sdk.getDeveloperSnapshot(orgGate.organizationId);
  return jsonOk(
    {
      validationResults: snapshot.validationResults,
      catalogCompatibility: sdk.extensions.listCatalog().map((m) => ({
        extensionId: m.id,
        ...sdk.compatibility.validateManifest(m),
      })),
    },
    { correlationId: gate.correlationId }
  );
}
