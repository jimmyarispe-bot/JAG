/**
 * Webhook + polling intake — enqueue sync jobs from external signals.
 */

import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type { SyncResult } from "@/lib/platform/integrations/common/types";

export async function processWebhook(
  platform: IntegrationPlatform,
  input: {
    instanceId: string;
    headers?: Record<string, string>;
    body: unknown;
  }
): Promise<SyncResult> {
  const config = platform.persistence.getConfiguration(input.instanceId);
  if (!config) throw new Error(`Unknown instance: ${input.instanceId}`);

  await platform.events.publish({
    type: "WebhookReceived",
    instanceId: input.instanceId,
    connectorId: config.connectorId,
    scope: config.scope,
    payload: {
      contentType: input.headers?.["content-type"] ?? "application/json",
    },
  });

  return platform.syncNow(input.instanceId, "webhook");
}

export async function runScheduledPoll(
  platform: IntegrationPlatform,
  instanceId: string
): Promise<SyncResult> {
  return platform.syncNow(instanceId, "poll");
}

export type SyncSchedule = {
  instanceId: string;
  cron: string;
  enabled: boolean;
};

export function listSchedules(platform: IntegrationPlatform): SyncSchedule[] {
  return platform.persistence.listConfigurations().map((c) => ({
    instanceId: c.instanceId,
    cron: c.scheduleCron ?? "0 */6 * * *",
    enabled: c.enabled,
  }));
}
