import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  decryptCredentialSecret,
  encryptCredentialSecret,
} from "@/lib/integration-hub/vault-crypto";
import type { IntegrationConnectionRow } from "@/lib/platform/integrations/connections/types";
import { createDemoMicrosoft365Client } from "@/lib/platform/integrations/connectors/microsoft-365/services/demo-client";
import { MICROSOFT_365_PROVIDER } from "@/lib/platform/integrations/microsoft-365/sync/instance-id";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type BridgedTokens = {
  connection: IntegrationConnectionRow;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshed: boolean;
};

function isExpired(expiresAt: string | null, skewMs = 60_000): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return false;
  return t <= Date.now() + skewMs;
}

async function getConnection(
  supabase: AuthClient,
  organizationId: string
): Promise<IntegrationConnectionRow | null> {
  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", MICROSOFT_365_PROVIDER)
    .maybeSingle();
  if (error) return null;
  return (data as IntegrationConnectionRow | null) ?? null;
}

export async function ensureMicrosoft365AccessToken(
  supabase: AuthClient,
  organizationId: string
): Promise<BridgedTokens | { error: string }> {
  const connection = await getConnection(supabase, organizationId);
  if (!connection) {
    return { error: "Microsoft 365 is not connected for this organization." };
  }
  if (connection.status !== "connected" && connection.status !== "pending") {
    return { error: `Microsoft 365 status is ${connection.status}.` };
  }

  let accessToken = connection.access_token
    ? decryptCredentialSecret(connection.access_token) ?? connection.access_token
    : null;
  let refreshToken = connection.refresh_token
    ? decryptCredentialSecret(connection.refresh_token) ?? connection.refresh_token
    : null;
  let expiresAt = connection.expires_at;
  let refreshed = false;

  if ((!accessToken || isExpired(expiresAt)) && refreshToken) {
    const client = createDemoMicrosoft365Client();
    const result = await client.refreshToken(refreshToken);
    if (!result.ok || !result.accessToken) {
      await supabase
        .from("integration_connections")
        .update({
          status: "error",
          last_sync_error: result.error ?? "Token refresh failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);
      return { error: result.error ?? "Token refresh failed" };
    }
    accessToken = result.accessToken;
    refreshToken = result.refreshToken ?? refreshToken;
    expiresAt = result.expiresAt ?? new Date(Date.now() + 3_600_000).toISOString();
    refreshed = true;

    await supabase
      .from("integration_connections")
      .update({
        access_token: encryptCredentialSecret(accessToken),
        refresh_token: refreshToken
          ? encryptCredentialSecret(refreshToken)
          : connection.refresh_token,
        expires_at: expiresAt,
        status: "connected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id)
      .eq("provider", MICROSOFT_365_PROVIDER);
  }

  if (!accessToken) {
    return { error: "Missing Microsoft 365 access token." };
  }

  return {
    connection: {
      ...connection,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      status: "connected",
    },
    accessToken,
    refreshToken,
    expiresAt,
    refreshed,
  };
}
