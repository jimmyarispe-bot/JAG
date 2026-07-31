import { randomUUID } from "node:crypto";
import {
  decryptCredentialPayload,
  encryptCredentialPayload,
} from "@/lib/connectors/credentials";
import { createConnectorScheduler } from "@/lib/connectors/scheduler";
import { transitionConnectorStatus } from "@/lib/connectors/status";
import {
  getCredentialForInstallation,
  listInstallationsForOrganization,
  upsertCredential,
  upsertInstallation,
} from "@/lib/connectors/store";
import type { ConnectorInstallation, ScheduleFrequency } from "@/lib/connectors/types";
import {
  createDemoGoogleWorkspaceTokens,
  isGoogleTokenExpired,
  refreshGoogleWorkspaceJagTokens,
} from "@/lib/connectors/google-workspace/oauth";
import {
  GWS_CONNECTOR_ID,
  type GwsTokenBundle,
} from "@/lib/connectors/google-workspace/types";

export const GWS_SCHEDULES: readonly ScheduleFrequency[] = [
  "Manual",
  "Daily",
  "Weekly",
];

export function getGoogleWorkspaceInstallation(
  organizationId: string
): ConnectorInstallation | null {
  return (
    listInstallationsForOrganization(organizationId).find(
      (i) => i.connectorId === GWS_CONNECTOR_ID
    ) ?? null
  );
}

export function ensureGoogleWorkspaceInstallation(
  organizationId: string
): ConnectorInstallation {
  const existing = getGoogleWorkspaceInstallation(organizationId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const plan = createConnectorScheduler().planNextRun({
    organizationId,
    installationId: "pending",
    frequency: "Manual",
  });
  return upsertInstallation({
    id: randomUUID(),
    organizationId,
    connectorId: GWS_CONNECTOR_ID,
    status: "Installed",
    health: "Offline",
    enabled: true,
    version: "1.0.0",
    lastSyncAt: null,
    nextScheduledSyncAt: plan.nextRunAt,
    scheduleFrequency: "Manual",
    companyName: null,
    companyId: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  });
}

export function saveGoogleWorkspaceTokens(input: {
  organizationId: string;
  tokens: GwsTokenBundle;
  scheduleFrequency?: ScheduleFrequency;
}): ConnectorInstallation {
  const installation = ensureGoogleWorkspaceInstallation(input.organizationId);
  const frequency = input.scheduleFrequency ?? installation.scheduleFrequency;
  const plan = createConnectorScheduler().planNextRun({
    organizationId: input.organizationId,
    installationId: installation.id,
    frequency,
  });
  const now = new Date().toISOString();
  let from = installation.status;
  if (from === "Not Installed") from = "Installed";
  if (from === "Syncing") from = "Connected";
  const status = transitionConnectorStatus(from, "Connected");

  const updated = upsertInstallation({
    ...installation,
    status,
    health: "Healthy",
    enabled: true,
    version: "1.0.0",
    companyName: input.tokens.userEmail,
    companyId: input.tokens.domain,
    lastError: null,
    scheduleFrequency: frequency,
    nextScheduledSyncAt: plan.nextRunAt,
    updatedAt: now,
  });

  const encrypted = encryptCredentialPayload(
    JSON.stringify(input.tokens),
    input.organizationId
  );
  const existingCred = getCredentialForInstallation(
    input.organizationId,
    updated.id
  );
  upsertCredential({
    id: existingCred?.id ?? randomUUID(),
    organizationId: input.organizationId,
    installationId: updated.id,
    authenticationType: "OAuth 2.0",
    encryptedPayload: encrypted,
    createdAt: existingCred?.createdAt ?? now,
    updatedAt: now,
  });

  return updated;
}

export function connectGoogleWorkspaceDemo(input: {
  organizationId: string;
  userEmail?: string;
  domain?: string;
  scheduleFrequency?: ScheduleFrequency;
}): ConnectorInstallation {
  return saveGoogleWorkspaceTokens({
    organizationId: input.organizationId,
    tokens: createDemoGoogleWorkspaceTokens({
      userEmail: input.userEmail,
      domain: input.domain,
    }),
    scheduleFrequency: input.scheduleFrequency,
  });
}

export function disconnectGoogleWorkspace(
  organizationId: string
): ConnectorInstallation | null {
  const installation = getGoogleWorkspaceInstallation(organizationId);
  if (!installation) return null;
  const now = new Date().toISOString();
  let from = installation.status;
  if (from === "Not Installed") from = "Installed";
  const status = transitionConnectorStatus(from, "Disconnected");
  const cred = getCredentialForInstallation(organizationId, installation.id);
  if (cred) {
    upsertCredential({
      ...cred,
      encryptedPayload: encryptCredentialPayload(
        JSON.stringify({ revoked: true }),
        organizationId
      ),
      updatedAt: now,
    });
  }
  return upsertInstallation({
    ...installation,
    status,
    health: "Offline",
    enabled: false,
    lastError: null,
    updatedAt: now,
  });
}

export function loadGoogleWorkspaceTokens(
  organizationId: string
):
  | { ok: true; tokens: GwsTokenBundle; installation: ConnectorInstallation }
  | { ok: false; error: string } {
  const installation = getGoogleWorkspaceInstallation(organizationId);
  if (!installation) {
    return { ok: false, error: "Google Workspace is not installed." };
  }
  const cred = getCredentialForInstallation(organizationId, installation.id);
  if (!cred) {
    return { ok: false, error: "Google Workspace credentials are missing." };
  }
  try {
    const tokens = JSON.parse(
      decryptCredentialPayload(cred.encryptedPayload, organizationId)
    ) as GwsTokenBundle & { revoked?: boolean };
    if (tokens.revoked) {
      return { ok: false, error: "Google Workspace authorization was revoked." };
    }
    if (!tokens.accessToken || !tokens.refreshToken) {
      return { ok: false, error: "Google Workspace tokens are incomplete." };
    }
    return { ok: true, tokens, installation };
  } catch {
    return { ok: false, error: "Unable to decrypt Google Workspace credentials." };
  }
}

export async function ensureFreshGoogleWorkspaceTokens(
  organizationId: string,
  options?: {
    forceRefresh?: boolean;
    refreshImpl?: typeof refreshGoogleWorkspaceJagTokens;
  }
): Promise<
  | { ok: true; tokens: GwsTokenBundle; installation: ConnectorInstallation }
  | { ok: false; error: string }
> {
  const loaded = loadGoogleWorkspaceTokens(organizationId);
  if (!loaded.ok) return loaded;
  const { tokens, installation } = loaded;

  if (tokens.demo) {
    if (options?.forceRefresh) {
      const refreshed = {
        ...tokens,
        accessToken: `demo-gws-access-refreshed-${Date.now()}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      const updated = saveGoogleWorkspaceTokens({
        organizationId,
        tokens: refreshed,
      });
      return { ok: true, tokens: refreshed, installation: updated };
    }
    return { ok: true, tokens, installation };
  }

  if (!options?.forceRefresh && !isGoogleTokenExpired(tokens.expiresAt)) {
    return { ok: true, tokens, installation };
  }

  const refresh = options?.refreshImpl ?? refreshGoogleWorkspaceJagTokens;
  const result = await refresh(tokens.refreshToken);
  if (!result.ok) {
    upsertInstallation({
      ...installation,
      status: "Error",
      health: "Error",
      lastError: result.error,
      updatedAt: new Date().toISOString(),
    });
    return { ok: false, error: result.error };
  }

  const next: GwsTokenBundle = {
    ...tokens,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresAt,
  };
  const updated = saveGoogleWorkspaceTokens({ organizationId, tokens: next });
  return { ok: true, tokens: next, installation: updated };
}

export function updateGoogleWorkspaceSchedule(
  organizationId: string,
  frequency: ScheduleFrequency
): ConnectorInstallation | null {
  if (!GWS_SCHEDULES.includes(frequency)) return null;
  const installation = getGoogleWorkspaceInstallation(organizationId);
  if (!installation) return null;
  const plan = createConnectorScheduler().planNextRun({
    organizationId,
    installationId: installation.id,
    frequency,
  });
  return upsertInstallation({
    ...installation,
    scheduleFrequency: frequency,
    nextScheduledSyncAt: plan.nextRunAt,
    updatedAt: new Date().toISOString(),
  });
}

export function getGoogleWorkspaceStatusView(organizationId: string): {
  readonly connected: boolean;
  readonly status: string;
  readonly health: string;
  readonly user: string | null;
  readonly domain: string | null;
  readonly servicesEnabled: readonly string[];
  readonly lastSyncAt: string | null;
  readonly nextScheduledSyncAt: string | null;
  readonly scheduleFrequency: string | null;
} {
  const installation = getGoogleWorkspaceInstallation(organizationId);
  const loaded = loadGoogleWorkspaceTokens(organizationId);
  const tokens = loaded.ok ? loaded.tokens : null;
  return {
    connected: installation?.status === "Connected",
    status: installation?.status ?? "Not Installed",
    health: installation?.health ?? "Offline",
    user: tokens?.userEmail ?? installation?.companyName ?? null,
    domain: tokens?.domain ?? installation?.companyId ?? null,
    servicesEnabled: tokens?.servicesEnabled ?? [],
    lastSyncAt: installation?.lastSyncAt ?? null,
    nextScheduledSyncAt: installation?.nextScheduledSyncAt ?? null,
    scheduleFrequency: installation?.scheduleFrequency ?? null,
  };
}
