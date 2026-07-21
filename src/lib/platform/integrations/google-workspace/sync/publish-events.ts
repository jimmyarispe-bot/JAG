import { createEventBus } from "@/lib/platform/integrations/events/bus";
import { createEventPublisher } from "@/lib/platform/integrations/events/publisher";
import {
  GOOGLE_WORKSPACE_CONNECTOR_ID,
  googleWorkspaceInstanceId,
} from "@/lib/platform/integrations/google-workspace/sync/instance-id";
import type { GoogleSyncMode } from "@/lib/platform/integrations/google-workspace/sync/types";

const bus = createEventBus();
const publisher = createEventPublisher(bus);

export function getGoogleWorkspaceEventPublisher() {
  return publisher;
}

export function getGoogleWorkspaceSyncEventBus() {
  return bus;
}

export async function publishSyncStarted(input: {
  organizationId: string;
  jobId: string;
  mode: GoogleSyncMode;
}): Promise<void> {
  await publisher.publish(
    "SYNC_STARTED",
    {
      jobId: input.jobId,
      mode: input.mode,
      organizationId: input.organizationId,
      provider: "google_workspace",
    },
    {
      connectorId: GOOGLE_WORKSPACE_CONNECTOR_ID,
      instanceId: googleWorkspaceInstanceId(input.organizationId),
    }
  );
}

export async function publishSyncCompleted(input: {
  organizationId: string;
  jobId: string;
  mode: GoogleSyncMode;
  recordsFetched: number;
  recordsNormalized: number;
  durationMs: number;
}): Promise<void> {
  await publisher.publish(
    "SYNC_COMPLETED",
    {
      jobId: input.jobId,
      mode: input.mode,
      organizationId: input.organizationId,
      provider: "google_workspace",
      recordsFetched: input.recordsFetched,
      recordsNormalized: input.recordsNormalized,
      durationMs: input.durationMs,
    },
    {
      connectorId: GOOGLE_WORKSPACE_CONNECTOR_ID,
      instanceId: googleWorkspaceInstanceId(input.organizationId),
    }
  );
}

export async function publishSyncFailed(input: {
  organizationId: string;
  jobId: string;
  mode: GoogleSyncMode;
  error: string;
}): Promise<void> {
  await publisher.publish(
    "SYNC_FAILED",
    {
      jobId: input.jobId,
      mode: input.mode,
      organizationId: input.organizationId,
      provider: "google_workspace",
      error: input.error,
    },
    {
      connectorId: GOOGLE_WORKSPACE_CONNECTOR_ID,
      instanceId: googleWorkspaceInstanceId(input.organizationId),
    }
  );
}

export { publisher as googleWorkspaceSyncPublisher };
