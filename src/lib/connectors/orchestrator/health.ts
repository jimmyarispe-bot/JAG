/**
 * ConnectorHealth — unified health scoring (connector-agnostic).
 */

import {
  getConsecutiveFailures,
  listOrchestratorJobs,
} from "@/lib/connectors/orchestrator/store";
import { createConnectorTokenManager } from "@/lib/connectors/orchestrator/token-manager";
import type {
  HealthScoreInput,
  OrchestratorHealth,
} from "@/lib/connectors/orchestrator/types";
import { listInstallationsForOrganization } from "@/lib/connectors/store";

export type OrchestratorHealthService = {
  score(input: HealthScoreInput): OrchestratorHealth;
  evaluate(
    organizationId: string,
    connectorId: string
  ): {
    readonly health: OrchestratorHealth;
    readonly inputs: HealthScoreInput;
  };
  summarize(organizationId: string): Readonly<
    Record<OrchestratorHealth, number>
  >;
};

export function createOrchestratorHealthService(): OrchestratorHealthService {
  const tokens = createConnectorTokenManager();

  return {
    score(input) {
      if (!input.enabled || input.status === "Not Installed") {
        return "Offline";
      }
      if (
        input.status === "Disconnected" ||
        input.status === "Disabled" ||
        input.installationHealth === "Offline"
      ) {
        return "Offline";
      }
      if (
        input.tokenExpired ||
        input.consecutiveFailures >= 5 ||
        input.installationHealth === "Error" ||
        input.status === "Error"
      ) {
        return "Critical";
      }
      if (
        input.consecutiveFailures > 0 ||
        input.queueBacklog > 3 ||
        input.installationHealth === "Warning" ||
        !input.lastSuccessfulSyncAt
      ) {
        return "Warning";
      }
      return "Healthy";
    },

    evaluate(organizationId, connectorId) {
      const installation = listInstallationsForOrganization(
        organizationId
      ).find((i) => i.connectorId === connectorId);
      const token = tokens.inspect(organizationId, connectorId);
      const queueBacklog = listOrchestratorJobs(organizationId).filter(
        (j) =>
          j.connectorId === connectorId &&
          (j.status === "Queued" || j.status === "Retrying")
      ).length;
      const inputs: HealthScoreInput = {
        lastSuccessfulSyncAt: installation?.lastSyncAt ?? null,
        consecutiveFailures: getConsecutiveFailures(
          organizationId,
          connectorId
        ),
        tokenExpired:
          token.oauthState === "expired" ||
          token.refreshTokenStatus === "expired",
        queueBacklog,
        installationHealth: installation?.health ?? "Offline",
        enabled: installation?.enabled ?? false,
        status: installation?.status ?? "Not Installed",
      };
      return { health: this.score(inputs), inputs };
    },

    summarize(organizationId) {
      const counts: Record<OrchestratorHealth, number> = {
        Healthy: 0,
        Warning: 0,
        Critical: 0,
        Offline: 0,
      };
      for (const install of listInstallationsForOrganization(
        organizationId
      )) {
        const { health } = this.evaluate(
          organizationId,
          install.connectorId
        );
        counts[health] += 1;
      }
      return Object.freeze(counts);
    },
  };
}
