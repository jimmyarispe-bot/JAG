/**
 * Ensure QuickBooks production connector has completed at least one sync
 * so ECC financial widgets can consume live / cached accounting data.
 */

import { cache } from "react";
import { getIntegrationManagement } from "@/lib/exec/integration-platform";
import { quickbooksStore } from "@/lib/platform/integrations/connectors/quickbooks";
import { DEFAULT_EXEC_SCOPE } from "@/lib/exec/intelligence";

export type EnsureQuickBooksResult = {
  snapshot: ReturnType<typeof quickbooksStore.get>;
  freshlySynced: boolean;
};

export const ensureQuickBooksSynced = cache(async (): Promise<EnsureQuickBooksResult> => {
  const management = await getIntegrationManagement();
  const orgId = DEFAULT_EXEC_SCOPE.organizationId;
  const hadData = quickbooksStore.hasLiveData(orgId);

  if (!hadData) {
    const instanceId = `quickbooks-${orgId}`;
    const config =
      management.platform.persistence.getConfiguration(instanceId) ??
      (await management.connections.register({
        connectorId: "quickbooks",
        scope: { ...DEFAULT_EXEC_SCOPE },
        actor: "exec-quickbooks",
        settings: { environment: "sandbox" },
      }));
    await management.connections.authenticate(config.instanceId, "exec-quickbooks");
    await management.connections.connect(config.instanceId, "exec-quickbooks");
    await management.connections.initialSync(config.instanceId);
    return { snapshot: quickbooksStore.get(orgId), freshlySynced: true };
  }

  return { snapshot: quickbooksStore.get(orgId), freshlySynced: false };
});
