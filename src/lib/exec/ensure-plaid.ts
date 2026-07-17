/**
 * Ensure Plaid production connector has completed at least one sync
 * so ECC treasury / cash widgets can consume live / cached banking data.
 */

import { cache } from "react";
import { getIntegrationManagement } from "@/lib/exec/integration-platform";
import { plaidStore } from "@/lib/platform/integrations/connectors/plaid";
import { getExecRuntime } from "@/lib/exec/scope";

export type EnsurePlaidResult = {
  snapshot: ReturnType<typeof plaidStore.get>;
  freshlySynced: boolean;
};

export const ensurePlaidSynced = cache(async (): Promise<EnsurePlaidResult> => {
  const management = await getIntegrationManagement();
  const { scope } = await getExecRuntime();
  const orgId = scope.organizationId;
  const hadData = plaidStore.hasLiveData(orgId);

  if (!hadData) {
    const instanceId = `plaid-${orgId}`;
    const config =
      management.platform.persistence.getConfiguration(instanceId) ??
      (await management.connections.register({
        connectorId: "plaid",
        scope: { ...scope },
        actor: "exec-plaid",
        settings: { environment: "sandbox" },
      }));
    await management.connections.authenticate(config.instanceId, "exec-plaid");
    await management.connections.connect(config.instanceId, "exec-plaid");
    await management.connections.initialSync(config.instanceId);
    return { snapshot: plaidStore.get(orgId), freshlySynced: true };
  }

  return { snapshot: plaidStore.get(orgId), freshlySynced: false };
});
