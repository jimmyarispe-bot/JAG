/**
 * Ensure AcademyOS production connector has completed at least one sync
 * so ECC widgets can consume live normalized data.
 */

import { cache } from "react";
import { getIntegrationManagement } from "@/lib/exec/integration-platform";
import { academyOsStore } from "@/lib/platform/integrations/connectors/academyos";
import { DEFAULT_EXEC_SCOPE } from "@/lib/exec/intelligence";

export const ensureAcademyOsSynced = cache(async () => {
  const management = await getIntegrationManagement();
  const orgId = DEFAULT_EXEC_SCOPE.organizationId;

  if (!academyOsStore.hasLiveData(orgId)) {
    const instanceId = `academyos-${orgId}`;
    const config =
      management.platform.persistence.getConfiguration(instanceId) ??
      (await management.connections.register({
        connectorId: "academyos",
        scope: { ...DEFAULT_EXEC_SCOPE },
        actor: "exec-academyos",
      }));
    await management.connections.authenticate(config.instanceId, "exec-academyos");
    await management.connections.connect(config.instanceId, "exec-academyos");
    await management.connections.initialSync(config.instanceId);
  }

  return academyOsStore.get(orgId);
});
