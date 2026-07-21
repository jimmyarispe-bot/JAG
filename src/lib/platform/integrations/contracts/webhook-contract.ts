/**
 * Webhook ingestion contracts for the Integration Platform Core.
 */

import type { SyncResult } from "@/lib/platform/integrations/types";
import type { PlatformConnector } from "@/lib/platform/integrations/contracts/connector-contract";

export interface WebhookEnvelope {
  readonly connectorId: string;
  readonly instanceId: string;
  readonly headers?: Record<string, string>;
  readonly body: Record<string, unknown>;
  readonly receivedAt?: string;
}

export interface WebhookProcessor {
  process(connector: PlatformConnector, envelope: WebhookEnvelope): Promise<SyncResult>;
}
