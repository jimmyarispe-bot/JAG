import { getInstallation, listInstallationsForOrganization } from "@/lib/connectors/store";
import type { ConnectorHealth, ConnectorInstallation } from "@/lib/connectors/types";

export type ConnectorHealthService = {
  getHealth(
    organizationId: string,
    installationId: string
  ): ConnectorHealth | null;
  summarize(organizationId: string): {
    readonly healthy: number;
    readonly warning: number;
    readonly offline: number;
    readonly error: number;
  };
  evaluate(installation: ConnectorInstallation): ConnectorHealth;
};

export function createConnectorHealthService(): ConnectorHealthService {
  return {
    getHealth(organizationId, installationId) {
      const row = getInstallation(organizationId, installationId);
      return row ? this.evaluate(row) : null;
    },
    summarize(organizationId) {
      const rows = listInstallationsForOrganization(organizationId);
      const out = { healthy: 0, warning: 0, offline: 0, error: 0 };
      for (const row of rows) {
        const h = this.evaluate(row);
        if (h === "Healthy") out.healthy++;
        else if (h === "Warning") out.warning++;
        else if (h === "Offline") out.offline++;
        else out.error++;
      }
      return out;
    },
    evaluate(installation) {
      if (!installation.enabled || installation.status === "Disabled") {
        return "Offline";
      }
      if (installation.status === "Error") return "Error";
      if (
        installation.status === "Disconnected" ||
        installation.status === "Not Installed"
      ) {
        return "Offline";
      }
      if (installation.status === "Syncing") return "Warning";
      if (installation.health) return installation.health;
      return "Healthy";
    },
  };
}
