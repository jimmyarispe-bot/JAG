import { canAccessConnectorOrganization } from "@/lib/connectors";
import {
  jsonError,
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";
import { JagErrors } from "@/lib/jag-platform/errors";
import { getPlatformSdk, type ExtensionManifest } from "@/lib/platform-sdk";

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
  return jsonOk(
    {
      catalog: sdk.extensions.listCatalog(),
      installed: sdk.extensions.listInstalled(orgGate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    extensionId?: string;
    manifest?: ExtensionManifest;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessConnectorOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const sdk = getPlatformSdk();
  const lifecycle = sdk.extensions.lifecycle;

  try {
    switch (body.action) {
      case "registerCatalog": {
        if (!body.manifest) {
          return jsonError(JagErrors.validation("manifest is required."));
        }
        sdk.extensions.registerCatalog(body.manifest);
        return jsonOk(
          { catalog: sdk.extensions.listCatalog() },
          { correlationId: gate.correlationId }
        );
      }
      case "install": {
        if (!body.manifest) {
          return jsonError(JagErrors.validation("manifest is required."));
        }
        const record = lifecycle.install(
          orgGate.organizationId,
          body.manifest
        );
        return jsonOk({ record }, { correlationId: gate.correlationId });
      }
      case "enable":
      case "disable":
      case "uninstall":
      case "validate": {
        if (!body.extensionId) {
          return jsonError(JagErrors.validation("extensionId is required."));
        }
        if (body.action === "enable") {
          return jsonOk(
            {
              record: lifecycle.enable(
                orgGate.organizationId,
                body.extensionId
              ),
            },
            { correlationId: gate.correlationId }
          );
        }
        if (body.action === "disable") {
          return jsonOk(
            {
              record: lifecycle.disable(
                orgGate.organizationId,
                body.extensionId
              ),
            },
            { correlationId: gate.correlationId }
          );
        }
        if (body.action === "uninstall") {
          return jsonOk(
            {
              removed: lifecycle.uninstall(
                orgGate.organizationId,
                body.extensionId
              ),
            },
            { correlationId: gate.correlationId }
          );
        }
        return jsonOk(
          {
            result: lifecycle.validate(
              orgGate.organizationId,
              body.extensionId
            ),
          },
          { correlationId: gate.correlationId }
        );
      }
      case "upgrade": {
        if (!body.manifest || !body.extensionId) {
          return jsonError(
            JagErrors.validation("manifest and extensionId are required.")
          );
        }
        return jsonOk(
          {
            record: lifecycle.upgrade(
              orgGate.organizationId,
              body.extensionId,
              body.manifest
            ),
          },
          { correlationId: gate.correlationId }
        );
      }
      default:
        return jsonError(JagErrors.validation("Unknown action."));
    }
  } catch (err) {
    return jsonError(
      JagErrors.validation(
        err instanceof Error ? err.message : "Extension action failed."
      )
    );
  }
}
