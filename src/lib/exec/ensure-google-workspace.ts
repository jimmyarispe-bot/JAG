/**
 * Ensure Google Workspace production connector has completed at least one sync
 * so ECC collaboration widgets can consume live / cached productivity metadata.
 */

import { cache } from "react";
import { getIntegrationManagement } from "@/lib/exec/integration-platform";
import { googleWorkspaceStore } from "@/lib/platform/integrations/connectors/google-workspace";
import { getExecRuntime } from "@/lib/exec/scope";

export type EnsureGoogleWorkspaceResult = {
  snapshot: ReturnType<typeof googleWorkspaceStore.get>;
  freshlySynced: boolean;
};

export const ensureGoogleWorkspaceSynced = cache(
  async (): Promise<EnsureGoogleWorkspaceResult> => {
    const management = await getIntegrationManagement();
    const { scope } = await getExecRuntime();
    const orgId = scope.organizationId;
    const hadData = googleWorkspaceStore.hasLiveData(orgId);

    if (!hadData) {
      const instanceId = `google-${orgId}`;
      const config =
        management.platform.persistence.getConfiguration(instanceId) ??
        (await management.connections.register({
          connectorId: "google",
          scope: { ...scope },
          actor: "exec-google",
          settings: {
            domain: "jag-demo.edu",
            consentType: "admin",
            storeEmailBodies: false,
            storeDocumentContents: false,
          },
        }));
      await management.connections.authenticate(config.instanceId, "exec-google");
      await management.connections.connect(config.instanceId, "exec-google");
      await management.connections.initialSync(config.instanceId);
      return { snapshot: googleWorkspaceStore.get(orgId), freshlySynced: true };
    }

    return { snapshot: googleWorkspaceStore.get(orgId), freshlySynced: false };
  }
);
