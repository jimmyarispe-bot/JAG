export type {
  GoogleSyncMode,
  GoogleSyncOptions,
  GoogleSyncProgressStatus,
  GoogleSyncRegistry,
  GoogleSyncResult,
  GoogleSyncRun,
  GoogleSyncRunStatus,
  GoogleSyncTriggeredBy,
} from "@/lib/platform/integrations/google-workspace/sync/types";

export {
  GOOGLE_WORKSPACE_CONNECTOR_ID,
  GOOGLE_WORKSPACE_PROVIDER_VERSION,
  googleWorkspaceInstanceId,
} from "@/lib/platform/integrations/google-workspace/sync/instance-id";

export { runGoogleWorkspaceSync } from "@/lib/platform/integrations/google-workspace/sync/engine";
export { getGoogleWorkspaceSyncProgress } from "@/lib/platform/integrations/google-workspace/sync/progress";
export { processGoogleWorkspaceSyncJobs } from "@/lib/platform/integrations/google-workspace/sync/automation";
export {
  ensureSyncRegistry,
  getSyncRegistry,
  listDueGoogleWorkspaceSyncs,
  touchSyncRegistryAfterRun,
} from "@/lib/platform/integrations/google-workspace/sync/registry-store";
export { memoryGoogleSyncRegistry } from "@/lib/platform/integrations/google-workspace/sync/memory-registry";
export {
  publishSyncStarted,
  publishSyncCompleted,
  publishSyncFailed,
  getGoogleWorkspaceEventPublisher,
  getGoogleWorkspaceSyncEventBus,
} from "@/lib/platform/integrations/google-workspace/sync/publish-events";
