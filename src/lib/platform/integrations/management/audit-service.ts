import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type { AuditLogEntry } from "@/lib/platform/integrations/common/types";

export class IntegrationAuditService {
  constructor(private readonly platform: IntegrationPlatform) {}

  record(
    input: {
      instanceId: string;
      connectorId: string;
      action: string;
      actor?: string;
      detail?: Record<string, unknown>;
    }
  ): AuditLogEntry {
    return this.platform.persistence.appendAudit({
      instanceId: input.instanceId,
      connectorId: input.connectorId,
      action: input.action,
      actor: input.actor ?? "system",
      detail: input.detail ?? {},
    });
  }

  list(instanceId?: string, limit = 50): AuditLogEntry[] {
    return this.platform.persistence.listAudit(instanceId, limit);
  }

  /** Convenience filters for ECC audit panel. */
  lifecycleEvents(instanceId?: string, limit = 50): AuditLogEntry[] {
    const actions = new Set([
      "connection_created",
      "credentials_updated",
      "credentials_refreshed",
      "sync_started",
      "sync_completed",
      "sync_failed",
      "connector_disabled",
      "connector_paused",
      "connector_resumed",
      "connector_removed",
      "connector_validated",
    ]);
    return this.list(instanceId, limit * 2)
      .filter((a) => actions.has(a.action))
      .slice(0, limit);
  }
}
