/**
 * Webhook processor — routes inbound envelopes through the sync lifecycle.
 */

import type { PlatformConnector } from "@/lib/platform/integrations/contracts";
import type {
  WebhookEnvelope,
  WebhookProcessor,
} from "@/lib/platform/integrations/contracts/webhook-contract";
import type { SyncResult } from "@/lib/platform/integrations/types";
import type { IntegrationSyncEngine } from "@/lib/platform/integrations/core/sync";

export class IntegrationWebhookProcessor implements WebhookProcessor {
  constructor(private readonly syncEngine: IntegrationSyncEngine) {}

  async process(connector: PlatformConnector, envelope: WebhookEnvelope): Promise<SyncResult> {
    return this.syncEngine.run(connector, {
      connectorId: envelope.connectorId,
      instanceId: envelope.instanceId,
      mode: "incremental",
      triggeredBy: "webhook",
      objectTypes: typeof envelope.body.type === "string" ? [envelope.body.type] : undefined,
    });
  }
}

export function createWebhookProcessor(
  syncEngine: IntegrationSyncEngine
): IntegrationWebhookProcessor {
  return new IntegrationWebhookProcessor(syncEngine);
}
