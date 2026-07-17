/**
 * Ensure Square production connector has completed at least one sync
 * so ECC financial/customer widgets can consume live / cached payment data.
 */

import { cache } from "react";
import { getIntegrationManagement } from "@/lib/exec/integration-platform";
import { squareStore } from "@/lib/platform/integrations/connectors/square";
import { getExecRuntime } from "@/lib/exec/scope";

export type EnsureSquareResult = {
  snapshot: ReturnType<typeof squareStore.get>;
  freshlySynced: boolean;
};

export const ensureSquareSynced = cache(async (): Promise<EnsureSquareResult> => {
  const management = await getIntegrationManagement();
  const { scope } = await getExecRuntime();
  const orgId = scope.organizationId;
  const hadData = squareStore.hasLiveData(orgId);

  if (!hadData) {
    const instanceId = `square-${orgId}`;
    const config =
      management.platform.persistence.getConfiguration(instanceId) ??
      (await management.connections.register({
        connectorId: "square",
        scope: { ...scope },
        actor: "exec-square",
        settings: { environment: "sandbox" },
      }));
    await management.connections.authenticate(config.instanceId, "exec-square");
    await management.connections.connect(config.instanceId, "exec-square");
    await management.connections.initialSync(config.instanceId);
    return { snapshot: squareStore.get(orgId), freshlySynced: true };
  }

  return { snapshot: squareStore.get(orgId), freshlySynced: false };
});
