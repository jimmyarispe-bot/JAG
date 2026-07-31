/**
 * Connect / disconnect / reconnect QuickBooks for an organization.
 */

import { randomUUID } from "node:crypto";
import {
  encryptCredentialPayload,
  decryptCredentialPayload,
} from "@/lib/connectors/credentials";
import { createConnectorScheduler } from "@/lib/connectors/scheduler";
import { transitionConnectorStatus } from "@/lib/connectors/status";
import {
  getCredentialForInstallation,
  getInstallation,
  listInstallationsForOrganization,
  upsertCredential,
  upsertInstallation,
} from "@/lib/connectors/store";
import type { ConnectorInstallation, ScheduleFrequency } from "@/lib/connectors/types";
import {
  createDemoQuickBooksTokens,
  isTokenExpired,
  refreshQuickBooksTokens,
} from "@/lib/connectors/quickbooks/oauth";
import { QBO_CONNECTOR_ID, type QboTokenBundle } from "@/lib/connectors/quickbooks/types";
import { qboError } from "@/lib/connectors/quickbooks/errors";
import type { QboConnectorError } from "@/lib/connectors/quickbooks/types";

const QBO_SCHEDULES: readonly ScheduleFrequency[] = ["Manual", "Daily", "Weekly"];

function parseTokens(json: string): QboTokenBundle {
  return JSON.parse(json) as QboTokenBundle;
}

export function getQuickBooksInstallation(
  organizationId: string
): ConnectorInstallation | null {
  return (
    listInstallationsForOrganization(organizationId).find(
      (i) => i.connectorId === QBO_CONNECTOR_ID
    ) ?? null
  );
}

export function ensureQuickBooksInstallation(
  organizationId: string
): ConnectorInstallation {
  const existing = getQuickBooksInstallation(organizationId);
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
    connectorId: QBO_CONNECTOR_ID,
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

export function saveQuickBooksTokens(input: {
  organizationId: string;
  tokens: QboTokenBundle;
  scheduleFrequency?: ScheduleFrequency;
}): ConnectorInstallation {
  const installation = ensureQuickBooksInstallation(input.organizationId);
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
    companyName: input.tokens.companyName,
    companyId: input.tokens.realmId,
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

export function connectQuickBooksDemo(input: {
  organizationId: string;
  companyName?: string;
  scheduleFrequency?: ScheduleFrequency;
}): ConnectorInstallation {
  const tokens = createDemoQuickBooksTokens({
    companyName: input.companyName,
  });
  return saveQuickBooksTokens({
    organizationId: input.organizationId,
    tokens,
    scheduleFrequency: input.scheduleFrequency,
  });
}

export function disconnectQuickBooks(
  organizationId: string
): ConnectorInstallation | null {
  const installation = getQuickBooksInstallation(organizationId);
  if (!installation) return null;
  const now = new Date().toISOString();
  let from = installation.status;
  if (from === "Not Installed") from = "Installed";
  const status = transitionConnectorStatus(from, "Disconnected");
  // Clear credentials by replacing with revoked marker (no secrets logged).
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
    companyName: installation.companyName,
    companyId: installation.companyId,
    lastError: null,
    updatedAt: now,
  });
}

export function loadQuickBooksTokens(
  organizationId: string
):
  | { ok: true; tokens: QboTokenBundle; installation: ConnectorInstallation }
  | { ok: false; error: QboConnectorError } {
  const installation = getQuickBooksInstallation(organizationId);
  if (!installation) {
    return {
      ok: false,
      error: qboError("not_connected", "QuickBooks is not installed.", false),
    };
  }
  const cred = getCredentialForInstallation(organizationId, installation.id);
  if (!cred) {
    return {
      ok: false,
      error: qboError("not_connected", "QuickBooks credentials are missing.", false),
    };
  }
  try {
    const tokens = parseTokens(
      decryptCredentialPayload(cred.encryptedPayload, organizationId)
    );
    if ((tokens as { revoked?: boolean }).revoked) {
      return {
        ok: false,
        error: qboError(
          "revoked_authorization",
          "QuickBooks authorization was revoked.",
          false
        ),
      };
    }
    if (!tokens.accessToken || !tokens.refreshToken || !tokens.realmId) {
      return {
        ok: false,
        error: qboError("not_connected", "QuickBooks tokens are incomplete.", false),
      };
    }
    return { ok: true, tokens, installation };
  } catch {
    return {
      ok: false,
      error: qboError("not_connected", "Unable to decrypt QuickBooks credentials.", false),
    };
  }
}

export async function ensureFreshQuickBooksTokens(
  organizationId: string,
  options?: { forceRefresh?: boolean; refreshImpl?: typeof refreshQuickBooksTokens }
): Promise<
  | { ok: true; tokens: QboTokenBundle; installation: ConnectorInstallation }
  | { ok: false; error: QboConnectorError }
> {
  const loaded = loadQuickBooksTokens(organizationId);
  if (!loaded.ok) return loaded;

  const { tokens, installation } = loaded;
  if (tokens.demo) {
    if (options?.forceRefresh) {
      const refreshed = {
        ...tokens,
        accessToken: `demo-access-refreshed-${Date.now()}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      const updated = saveQuickBooksTokens({ organizationId, tokens: refreshed });
      return { ok: true, tokens: refreshed, installation: updated };
    }
    return { ok: true, tokens, installation };
  }

  if (!options?.forceRefresh && !isTokenExpired(tokens.expiresAt)) {
    return { ok: true, tokens, installation };
  }

  const refresh = options?.refreshImpl ?? refreshQuickBooksTokens;
  const result = await refresh(tokens.refreshToken);
  if (!result.ok) {
    const failed = upsertInstallation({
      ...installation,
      status: result.error.code === "revoked_authorization" ? "Disconnected" : "Error",
      health: "Error",
      lastError: result.error.message,
      updatedAt: new Date().toISOString(),
    });
    void failed;
    return { ok: false, error: result.error };
  }

  const next: QboTokenBundle = {
    ...tokens,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    expiresAt: result.tokens.expiresAt,
  };
  const updated = saveQuickBooksTokens({ organizationId, tokens: next });
  return { ok: true, tokens: next, installation: updated };
}

export function updateQuickBooksSchedule(
  organizationId: string,
  frequency: ScheduleFrequency
): ConnectorInstallation | null {
  if (!QBO_SCHEDULES.includes(frequency)) {
    return null;
  }
  const installation = getQuickBooksInstallation(organizationId);
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

export { QBO_SCHEDULES };
