import type {
  ConnectorCredentialRecord,
  ConnectorInstallation,
  ConnectorSyncEvent,
  ConnectorSyncJob,
} from "@/lib/connectors/types";

type ConnectorStore = {
  installations: ConnectorInstallation[];
  credentials: ConnectorCredentialRecord[];
  syncJobs: ConnectorSyncJob[];
  syncEvents: ConnectorSyncEvent[];
};

const g = globalThis as typeof globalThis & {
  __jagConnectorStore?: ConnectorStore;
};

function store(): ConnectorStore {
  if (!g.__jagConnectorStore) {
    g.__jagConnectorStore = {
      installations: [],
      credentials: [],
      syncJobs: [],
      syncEvents: [],
    };
  }
  return g.__jagConnectorStore;
}

export function resetConnectorStoreForTests(): void {
  g.__jagConnectorStore = {
    installations: [],
    credentials: [],
    syncJobs: [],
    syncEvents: [],
  };
}

export function listInstallationsForOrganization(
  organizationId: string
): readonly ConnectorInstallation[] {
  return store()
    .installations.filter((i) => i.organizationId === organizationId)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getInstallation(
  organizationId: string,
  installationId: string
): ConnectorInstallation | null {
  return (
    store().installations.find(
      (i) => i.id === installationId && i.organizationId === organizationId
    ) ?? null
  );
}

export function upsertInstallation(
  row: ConnectorInstallation
): ConnectorInstallation {
  const s = store();
  const idx = s.installations.findIndex((i) => i.id === row.id);
  if (idx >= 0) s.installations[idx] = row;
  else s.installations.push(row);
  return row;
}

export function listCredentialsForOrganization(
  organizationId: string
): readonly ConnectorCredentialRecord[] {
  return store().credentials.filter((c) => c.organizationId === organizationId);
}

export function upsertCredential(
  row: ConnectorCredentialRecord
): ConnectorCredentialRecord {
  const s = store();
  const idx = s.credentials.findIndex((c) => c.id === row.id);
  if (idx >= 0) s.credentials[idx] = row;
  else s.credentials.push(row);
  return row;
}

export function getCredentialForInstallation(
  organizationId: string,
  installationId: string
): ConnectorCredentialRecord | null {
  return (
    store().credentials.find(
      (c) =>
        c.organizationId === organizationId &&
        c.installationId === installationId
    ) ?? null
  );
}

export function listSyncJobsForOrganization(
  organizationId: string
): readonly ConnectorSyncJob[] {
  return store()
    .syncJobs.filter((j) => j.organizationId === organizationId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSyncJob(
  organizationId: string,
  syncJobId: string
): ConnectorSyncJob | null {
  return (
    store().syncJobs.find(
      (j) => j.id === syncJobId && j.organizationId === organizationId
    ) ?? null
  );
}

export function upsertSyncJob(row: ConnectorSyncJob): ConnectorSyncJob {
  const s = store();
  const idx = s.syncJobs.findIndex((j) => j.id === row.id);
  if (idx >= 0) s.syncJobs[idx] = row;
  else s.syncJobs.push(row);
  return row;
}

export function appendSyncEvent(row: ConnectorSyncEvent): ConnectorSyncEvent {
  store().syncEvents.push(row);
  return row;
}

export function listSyncEventsForJob(
  organizationId: string,
  syncJobId: string
): readonly ConnectorSyncEvent[] {
  return store()
    .syncEvents.filter(
      (e) => e.organizationId === organizationId && e.syncJobId === syncJobId
    )
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function listAllInstallations(): readonly ConnectorInstallation[] {
  return store().installations.slice();
}
