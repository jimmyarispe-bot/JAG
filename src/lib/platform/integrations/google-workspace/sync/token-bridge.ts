import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  decryptCredentialSecret,
  encryptCredentialSecret,
} from "@/lib/integration-hub/vault-crypto";
import {
  getGoogleWorkspaceConnection,
  GOOGLE_WORKSPACE_PROVIDER,
  type IntegrationConnectionRow,
} from "@/lib/platform/integrations/connections";
import { resolveGoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/client-factory";

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

export async function ensureGoogleWorkspaceAccessToken(
  supabase: AuthClient,
  organizationId: string
): Promise<BridgedTokens | { error: string }> {
  const connection = await getGoogleWorkspaceConnection(supabase, organizationId);
  if (!connection) {
    return { error: "Google Workspace is not connected for this organization." };
  }
  if (connection.status !== "connected" && connection.status !== "pending") {
    return { error: `Google Workspace status is ${connection.status}.` };
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
    // Real credentials mean a real exchange against oauth2.googleapis.com. The
    // fixture client used to sit here and would hand back a synthetic token that
    // Google had never issued, so an expired connection "refreshed" successfully
    // and then failed on every subsequent call for reasons nothing explained.
    const { client } = resolveGoogleWorkspaceClient({
      accessToken: accessToken ?? "",
      refreshToken,
    });
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
      .eq("provider", GOOGLE_WORKSPACE_PROVIDER);
  }

  if (!accessToken) {
    return { error: "Missing Google Workspace access token." };
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
