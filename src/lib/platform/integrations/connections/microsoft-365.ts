/**
 * RC-3.01 — Microsoft 365 OAuth connection lifecycle (DB-backed).
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  decryptCredentialSecret,
  encryptCredentialSecret,
} from "@/lib/integration-hub/vault-crypto";
import {
  buildMicrosoft365AuthorizeUrl,
  microsoft365OAuthConfig,
} from "@/lib/platform/integrations/connectors/microsoft-365/auth";
import {
  createSignedOAuthState,
  parseSignedOAuthState,
} from "@/lib/platform/integrations/core/oauth-state";
import type {
  IntegrationConnectionHealth,
  IntegrationConnectionRow,
  IntegrationConnectionStatus,
  Microsoft365ConnectionStatus,
} from "@/lib/platform/integrations/connections/types";
import { getMicrosoft365SyncProgress } from "@/lib/platform/integrations/microsoft-365/sync/progress";
import {
  MICROSOFT_365_PROVIDER,
  MICROSOFT_365_PROVIDER_VERSION,
} from "@/lib/platform/integrations/microsoft-365/sync/instance-id";
import { resolvePublicAppOrigin } from "@/lib/platform/branding/public-origin";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export { MICROSOFT_365_PROVIDER };

const EMPTY_SYNC_FIELDS = {
  currentSyncStatus: "idle" as const,
  recordsImported: 0,
  recordsChanged: 0,
  lastSyncDurationMs: null as number | null,
  nextScheduledSyncAt: null as string | null,
  nextFullSyncAt: null as string | null,
  consecutiveFailures: 0,
  errorDetails: null as string | null,
  providerVersion: null as string | null,
};

function appBaseUrl(): string {
  return resolvePublicAppOrigin();
}

export function microsoft365RedirectUri(): string {
  return `${appBaseUrl()}/api/integrations/microsoft/callback`;
}

export function microsoft365ClientConfig(): {
  clientId: string;
  clientSecret: string;
  configured: boolean;
} {
  const clientId =
    process.env.MICROSOFT_365_CLIENT_ID ||
    process.env.AZURE_AD_CLIENT_ID ||
    process.env.MICROSOFT_CLIENT_ID ||
    "";
  const clientSecret =
    process.env.MICROSOFT_365_CLIENT_SECRET ||
    process.env.AZURE_AD_CLIENT_SECRET ||
    process.env.MICROSOFT_CLIENT_SECRET ||
    "";
  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  };
}

function deriveHealth(input: {
  status: IntegrationConnectionStatus;
  expiresAt: string | null;
  lastSyncStatus: string | null;
  lastSuccessfulSyncAt: string | null;
  consecutiveFailures: number;
  errorDetails: string | null;
}): { health: IntegrationConnectionHealth; healthLabel: string } {
  if (input.status === "disconnected") {
    return { health: "disconnected", healthLabel: "Disconnected" };
  }
  if (input.status === "error") {
    return { health: "error", healthLabel: "Connection error" };
  }
  if (input.status === "pending") {
    return { health: "warning", healthLabel: "Pending" };
  }

  const expiresMs = input.expiresAt ? new Date(input.expiresAt).getTime() : null;
  const now = Date.now();
  if (expiresMs != null && (Number.isNaN(expiresMs) || expiresMs <= now)) {
    return { health: "error", healthLabel: "Token expired" };
  }
  if (input.consecutiveFailures >= 3 || input.lastSyncStatus === "failed") {
    return {
      health: "error",
      healthLabel: input.errorDetails ? "Sync failed" : "Sync error",
    };
  }
  if (expiresMs != null && expiresMs - now < 15 * 60 * 1000) {
    return { health: "warning", healthLabel: "Token expiring soon" };
  }
  if (input.consecutiveFailures > 0) {
    return { health: "warning", healthLabel: "Recent sync failures" };
  }
  if (!input.lastSuccessfulSyncAt) {
    return { health: "warning", healthLabel: "Awaiting first sync" };
  }
  const lastSuccessMs = new Date(input.lastSuccessfulSyncAt).getTime();
  if (!Number.isNaN(lastSuccessMs) && now - lastSuccessMs > 36 * 60 * 60 * 1000) {
    return { health: "warning", healthLabel: "Sync stale" };
  }
  return { health: "healthy", healthLabel: "Healthy" };
}

function toPublicStatus(
  row: IntegrationConnectionRow | null,
  sync?: {
    currentSyncStatus: Microsoft365ConnectionStatus["currentSyncStatus"];
    lastSuccessfulSyncAt: string | null;
    recordsImported: number;
    recordsChanged: number;
    lastSyncDurationMs: number | null;
    nextScheduledSyncAt: string | null;
    nextFullSyncAt: string | null;
    consecutiveFailures: number;
    errorDetails: string | null;
    providerVersion: string | null;
  }
): Microsoft365ConnectionStatus {
  if (!row) {
    return {
      provider: MICROSOFT_365_PROVIDER,
      status: "disconnected",
      connected: false,
      health: "disconnected",
      healthLabel: "Disconnected",
      lastSyncAt: null,
      expiresAt: null,
      connectedAt: null,
      connectionId: null,
      ...EMPTY_SYNC_FIELDS,
    };
  }

  const lastSuccessfulSyncAt =
    sync?.lastSuccessfulSyncAt ??
    (row.last_sync_status === "succeeded" ? row.last_sync_at ?? null : null);
  const consecutiveFailures = sync?.consecutiveFailures ?? 0;
  const errorDetails = sync?.errorDetails ?? row.last_sync_error ?? null;
  const { health, healthLabel } = deriveHealth({
    status: row.status,
    expiresAt: row.expires_at,
    lastSyncStatus: row.last_sync_status ?? null,
    lastSuccessfulSyncAt,
    consecutiveFailures,
    errorDetails,
  });

  return {
    provider: MICROSOFT_365_PROVIDER,
    status: row.status,
    connected: row.status === "connected",
    health,
    healthLabel,
    lastSyncAt: lastSuccessfulSyncAt ?? row.last_sync_at ?? null,
    expiresAt: row.expires_at,
    connectedAt: row.status === "connected" ? row.updated_at : null,
    connectionId: row.id,
    currentSyncStatus: sync?.currentSyncStatus ?? "idle",
    recordsImported: sync?.recordsImported ?? row.records_imported ?? 0,
    recordsChanged: sync?.recordsChanged ?? row.last_sync_records ?? 0,
    lastSyncDurationMs:
      sync?.lastSyncDurationMs ?? row.last_sync_duration_ms ?? null,
    nextScheduledSyncAt: sync?.nextScheduledSyncAt ?? null,
    nextFullSyncAt: sync?.nextFullSyncAt ?? null,
    consecutiveFailures,
    errorDetails,
    providerVersion: sync?.providerVersion ?? MICROSOFT_365_PROVIDER_VERSION,
  };
}

export async function getMicrosoft365Connection(
  supabase: AuthClient,
  organizationId: string
): Promise<IntegrationConnectionRow | null> {
  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", MICROSOFT_365_PROVIDER)
    .maybeSingle();

  if (error) {
    console.error("[integrations/microsoft] get connection failed", error.message);
    return null;
  }
  return (data as IntegrationConnectionRow | null) ?? null;
}

export async function getMicrosoft365Status(
  supabase: AuthClient,
  organizationId: string
): Promise<Microsoft365ConnectionStatus> {
  const row = await getMicrosoft365Connection(supabase, organizationId);
  if (!row) return toPublicStatus(null);

  const progress = await getMicrosoft365SyncProgress(supabase, organizationId);
  return toPublicStatus(row, {
    currentSyncStatus: progress.currentStatus,
    lastSuccessfulSyncAt: progress.lastSuccessfulSyncAt,
    recordsImported: progress.recordsImported,
    recordsChanged: progress.recordsChanged,
    lastSyncDurationMs: progress.lastSyncDurationMs,
    nextScheduledSyncAt: progress.nextScheduledSyncAt,
    nextFullSyncAt: progress.nextFullSyncAt,
    consecutiveFailures: progress.consecutiveFailures,
    errorDetails: progress.errorDetails,
    providerVersion: progress.providerVersion,
  });
}

export function buildMicrosoftConnectAuthorizeUrl(input: {
  organizationId: string;
  userId: string;
}): { authorizeUrl: string; state: string } | { error: string } {
  const { clientId, clientSecret, configured } = microsoft365ClientConfig();
  if (!configured) {
    return {
      error:
        "Microsoft 365 OAuth is not configured. Set MICROSOFT_365_CLIENT_ID and MICROSOFT_365_CLIENT_SECRET.",
    };
  }

  const state = createSignedOAuthState("ms", {
    organizationId: input.organizationId,
    userId: input.userId,
  });

  const oauth = microsoft365OAuthConfig({
    clientId,
    clientSecret,
    redirectUri: microsoft365RedirectUri(),
    tenant: process.env.MICROSOFT_365_TENANT || "common",
  });

  const authorizeUrl = buildMicrosoft365AuthorizeUrl(oauth, { state });
  return { authorizeUrl, state };
}

export function parseMicrosoftOAuthState(state: string): {
  organizationId: string;
  userId: string;
} | null {
  const claims = parseSignedOAuthState("ms", state);
  if (!claims) return null;
  return { organizationId: claims.organizationId, userId: claims.userId };
}

export async function exchangeMicrosoftAuthorizationCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
} | { error: string }> {
  const { clientId, clientSecret, configured } = microsoft365ClientConfig();
  if (!configured) {
    return { error: "Microsoft 365 OAuth is not configured." };
  }

  const tenant = process.env.MICROSOFT_365_TENANT || "common";
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: microsoft365RedirectUri(),
    grant_type: "authorization_code",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );

  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !json.access_token) {
    return {
      error: json.error_description || json.error || "Token exchange failed",
    };
  }

  const expiresAt = new Date(
    Date.now() + (json.expires_in ?? 3600) * 1000
  ).toISOString();

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresAt,
  };
}

export async function upsertMicrosoft365Connection(
  supabase: AuthClient,
  input: {
    organizationId: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    status?: IntegrationConnectionStatus;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const payload = {
    organization_id: input.organizationId,
    provider: MICROSOFT_365_PROVIDER,
    status: input.status ?? "connected",
    access_token: encryptCredentialSecret(input.accessToken),
    refresh_token: input.refreshToken
      ? encryptCredentialSecret(input.refreshToken)
      : null,
    expires_at: input.expiresAt,
    connected_by: input.userId,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("integration_connections")
    .upsert(payload, { onConflict: "organization_id,provider" })
    .select("id")
    .single();

  if (error) {
    console.error("[integrations/microsoft] upsert failed", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data.id as string };
}

/** Local/dev connect without Entra app credentials — still writes a real DB row. */
export async function connectMicrosoft365Demo(
  supabase: AuthClient,
  input: { organizationId: string; userId: string }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const result = await upsertMicrosoft365Connection(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    accessToken: "demo-microsoft-365-access-token",
    refreshToken: "demo-microsoft-365-refresh-token",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    status: "connected",
  });
  if (result.ok) {
    const { ensureSyncRegistry } = await import(
      "@/lib/platform/integrations/microsoft-365/sync/registry-store"
    );
    await ensureSyncRegistry(supabase, result.id, input.organizationId);
  }
  return result;
}

export async function disconnectMicrosoft365(
  supabase: AuthClient,
  organizationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("integration_connections")
    .upsert(
      {
        organization_id: organizationId,
        provider: MICROSOFT_365_PROVIDER,
        status: "disconnected",
        access_token: null,
        refresh_token: null,
        expires_at: null,
        updated_at: now,
      },
      { onConflict: "organization_id,provider" }
    );

  if (error) {
    console.error("[integrations/microsoft] disconnect failed", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export function readMicrosoftAccessToken(row: IntegrationConnectionRow): string | null {
  if (!row.access_token) return null;
  return decryptCredentialSecret(row.access_token) ?? row.access_token;
}
