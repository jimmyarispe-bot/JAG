/**
 * Integration Management — composition of lifecycle services on top of the platform.
 */

import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import { ConnectionManager } from "@/lib/platform/integrations/management/connection-manager";
import { ConnectorRegistryService } from "@/lib/platform/integrations/management/connector-registry";
import { CredentialManager } from "@/lib/platform/integrations/management/credential-manager";
import { IntegrationAuditService } from "@/lib/platform/integrations/management/audit-service";
import { ConnectorHealthMonitor } from "@/lib/platform/integrations/management/health-monitor";
import { RetryManager } from "@/lib/platform/integrations/management/retry-manager";
import { SyncHistoryService } from "@/lib/platform/integrations/management/sync-history";
import { SyncQueueService } from "@/lib/platform/integrations/management/sync-queue";
import { SyncScheduler } from "@/lib/platform/integrations/management/sync-scheduler";

export type IntegrationManagement = {
  platform: IntegrationPlatform;
  registry: ConnectorRegistryService;
  credentials: CredentialManager;
  audit: IntegrationAuditService;
  health: ConnectorHealthMonitor;
  history: SyncHistoryService;
  queue: SyncQueueService;
  scheduler: SyncScheduler;
  retries: RetryManager;
  connections: ConnectionManager;
};

export function createIntegrationManagement(
  platform: IntegrationPlatform
): IntegrationManagement {
  const registry = new ConnectorRegistryService(platform);
  const credentials = new CredentialManager(platform);
  const audit = new IntegrationAuditService(platform);
  const health = new ConnectorHealthMonitor(platform);
  const history = new SyncHistoryService(platform);
  const queue = new SyncQueueService(platform);
  const scheduler = new SyncScheduler(platform);
  const retries = new RetryManager(platform, queue);
  const connections = new ConnectionManager(platform, {
    registry,
    credentials,
    audit,
    health,
    history,
    queue,
    scheduler,
    retries,
  });

  return {
    platform,
    registry,
    credentials,
    audit,
    health,
    history,
    queue,
    scheduler,
    retries,
    connections,
  };
}

export {
  ConnectionManager,
  ConnectorRegistryService,
  CredentialManager,
  IntegrationAuditService,
  ConnectorHealthMonitor,
  RetryManager,
  SyncHistoryService,
  SyncQueueService,
  SyncScheduler,
};
export { computeNextSyncAt } from "@/lib/platform/integrations/management/sync-scheduler";
