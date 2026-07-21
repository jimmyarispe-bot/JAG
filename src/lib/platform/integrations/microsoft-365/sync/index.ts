export type {
  MicrosoftSyncMode,
  MicrosoftSyncOptions,
  MicrosoftSyncProgressStatus,
  MicrosoftSyncRegistry,
  MicrosoftSyncResult,
  MicrosoftSyncRun,
  MicrosoftSyncRunStatus,
  MicrosoftSyncTriggeredBy,
} from "@/lib/platform/integrations/microsoft-365/sync/types";

export {
  MICROSOFT_365_CONNECTOR_ID,
  MICROSOFT_365_PROVIDER,
  MICROSOFT_365_PROVIDER_VERSION,
  microsoft365InstanceId,
} from "@/lib/platform/integrations/microsoft-365/sync/instance-id";

export { runMicrosoft365Sync } from "@/lib/platform/integrations/microsoft-365/sync/engine";
export { getMicrosoft365SyncProgress } from "@/lib/platform/integrations/microsoft-365/sync/progress";
export { processMicrosoft365SyncJobs } from "@/lib/platform/integrations/microsoft-365/sync/automation";
export {
  ensureSyncRegistry,
  getSyncRegistry,
  listDueMicrosoft365Syncs,
  touchSyncRegistryAfterRun,
} from "@/lib/platform/integrations/microsoft-365/sync/registry-store";
export { memoryMicrosoftSyncRegistry } from "@/lib/platform/integrations/microsoft-365/sync/memory-registry";
export {
  publishSyncStarted,
  publishSyncCompleted,
  publishSyncFailed,
  getMicrosoft365EventPublisher,
  getMicrosoft365SyncEventBus,
} from "@/lib/platform/integrations/microsoft-365/sync/publish-events";
