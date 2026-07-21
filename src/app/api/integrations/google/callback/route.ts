import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { requireOrganizationAccess } from "@/lib/platform/identity/tenant-access";
import { logSecurityEvent } from "@/lib/platform/identity/security";
import {
  exchangeGoogleAuthorizationCode,
  parseGoogleOAuthState,
  upsertGoogleWorkspaceConnection,
} from "@/lib/platform/integrations/connections";

function settingsRedirect(query: Record<string, string>): NextResponse {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const url = new URL("/settings/integrations/google", base);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

async function guardIntegrations(supabase: Awaited<ReturnType<typeof createAuthClient>>) {
  let gate = await guardApiRoute(supabase, "integration.manage");
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "integration.admin");
  }
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "configuration.manage");
  }
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "configuration.admin");
  }
  return gate;
}

/**
 * GET /api/integrations/google/callback
 * Google OAuth return — verifies signed state, session, org membership, then persists.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return settingsRedirect({
      error: oauthError,
      connected: "0",
    });
  }

  if (!code || !state) {
    return settingsRedirect({ error: "missing_code", connected: "0" });
  }

  const parsed = parseGoogleOAuthState(state);
  if (!parsed) {
    return settingsRedirect({ error: "invalid_state", connected: "0" });
  }

  const supabase = await createAuthClient();
  const gate = await guardIntegrations(supabase);
  if (gate instanceof NextResponse) {
    return settingsRedirect({ error: "forbidden", connected: "0" });
  }

  if (gate.userId !== parsed.userId) {
    return settingsRedirect({ error: "state_user_mismatch", connected: "0" });
  }

  const orgScope = await requireOrganizationAccess(
    supabase,
    gate.userId,
    parsed.organizationId
  );
  if (orgScope !== true) {
    return settingsRedirect({ error: "forbidden_org", connected: "0" });
  }

  const tokens = await exchangeGoogleAuthorizationCode(code);
  if ("error" in tokens) {
    return settingsRedirect({ error: tokens.error, connected: "0" });
  }

  const saved = await upsertGoogleWorkspaceConnection(supabase, {
    organizationId: parsed.organizationId,
    userId: gate.userId,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  });

  if (!saved.ok) {
    return settingsRedirect({ error: saved.error, connected: "0" });
  }

  await logSecurityEvent(supabase, {
    eventType: "sensitive_access",
    summary: "Google Workspace OAuth connection established",
    actorUserId: gate.userId,
    userId: gate.userId,
    metadata: {
      organizationId: parsed.organizationId,
      provider: "google_workspace",
      connectionId: saved.id,
    },
  });

  const { ensureSyncRegistry } = await import(
    "@/lib/platform/integrations/google-workspace/sync/registry-store"
  );
  await ensureSyncRegistry(supabase, saved.id, parsed.organizationId);

  return settingsRedirect({ connected: "1" });
}
