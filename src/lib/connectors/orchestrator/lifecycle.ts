/**
 * ConnectorLifecycle — status transitions for orchestrated installations.
 */

import { transitionConnectorStatus } from "@/lib/connectors/status";
import {
  listInstallationsForOrganization,
  upsertInstallation,
} from "@/lib/connectors/store";
import type { ConnectorStatus } from "@/lib/connectors/types";
import { createConnectorAudit } from "@/lib/connectors/orchestrator/audit";

export type ConnectorLifecycleService = {
  transition(input: {
    organizationId: string;
    connectorId: string;
    to: ConnectorStatus;
    actor: string;
  }): { readonly ok: true } | { readonly ok: false; readonly error: string };
  disable(input: {
    organizationId: string;
    connectorId: string;
    actor: string;
  }): { readonly ok: boolean; readonly error?: string };
};

export function createConnectorLifecycle(): ConnectorLifecycleService {
  const audit = createConnectorAudit();

  return {
    transition(input) {
      const installation = listInstallationsForOrganization(
        input.organizationId
      ).find((i) => i.connectorId === input.connectorId);
      if (!installation) {
        return { ok: false, error: "Connector is not installed." };
      }
      try {
        const status = transitionConnectorStatus(
          installation.status,
          input.to
        );
        upsertInstallation({
          ...installation,
          status,
          updatedAt: new Date().toISOString(),
        });
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : "Invalid lifecycle transition.",
        };
      }
    },
    disable(input) {
      const installation = listInstallationsForOrganization(
        input.organizationId
      ).find((i) => i.connectorId === input.connectorId);
      if (!installation) {
        return { ok: false, error: "Connector is not installed." };
      }
      let status = installation.status;
      try {
        if (status !== "Disabled") {
          status = transitionConnectorStatus(status, "Disabled");
        }
      } catch {
        status = "Disabled";
      }
      upsertInstallation({
        ...installation,
        status,
        enabled: false,
        updatedAt: new Date().toISOString(),
      });
      audit.record({
        organizationId: input.organizationId,
        connectorId: input.connectorId,
        kind: "Disabled",
        actor: input.actor,
        message: "Connector disabled by orchestrator lifecycle.",
      });
      return { ok: true };
    },
  };
}
