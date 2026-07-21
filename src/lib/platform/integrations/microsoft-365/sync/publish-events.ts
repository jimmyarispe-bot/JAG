import { createEventBus } from "@/lib/platform/integrations/events/bus";
import { createEventPublisher } from "@/lib/platform/integrations/events/publisher";
import {
  MICROSOFT_365_CONNECTOR_ID,
  microsoft365InstanceId,
} from "@/lib/platform/integrations/microsoft-365/sync/instance-id";
import type { MicrosoftSyncMode } from "@/lib/platform/integrations/microsoft-365/sync/types";

const bus = createEventBus();
const publisher = createEventPublisher(bus);

export function getMicrosoft365EventPublisher() {
  return publisher;
}

export function getMicrosoft365SyncEventBus() {
  return bus;
}

export async function publishSyncStarted(input: {
  organizationId: string;
  jobId: string;
  mode: MicrosoftSyncMode;
}): Promise<void> {
  await publisher.publish(
    "SYNC_STARTED",
    {
      jobId: input.jobId,
      mode: input.mode,
      organizationId: input.organizationId,
      provider: "microsoft_365",
    },
    {
      connectorId: MICROSOFT_365_CONNECTOR_ID,
      instanceId: microsoft365InstanceId(input.organizationId),
    }
  );
}

export async function publishSyncCompleted(input: {
  organizationId: string;
  jobId: string;
  mode: MicrosoftSyncMode;
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
      provider: "microsoft_365",
      recordsFetched: input.recordsFetched,
      recordsNormalized: input.recordsNormalized,
      durationMs: input.durationMs,
    },
    {
      connectorId: MICROSOFT_365_CONNECTOR_ID,
      instanceId: microsoft365InstanceId(input.organizationId),
    }
  );
}

export async function publishSyncFailed(input: {
  organizationId: string;
  jobId: string;
  mode: MicrosoftSyncMode;
  error: string;
}): Promise<void> {
  await publisher.publish(
    "SYNC_FAILED",
    {
      jobId: input.jobId,
      mode: input.mode,
      organizationId: input.organizationId,
      provider: "microsoft_365",
      error: input.error,
    },
    {
      connectorId: MICROSOFT_365_CONNECTOR_ID,
      instanceId: microsoft365InstanceId(input.organizationId),
    }
  );
}
