import { NextResponse } from "next/server";
import {
  canAccessConnectorOrganization,
  exchangeGoogleWorkspaceJagCode,
  parseGoogleWorkspaceOAuthState,
  saveGoogleWorkspaceTokens,
} from "@/lib/connectors";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { resolvePublicAppOrigin } from "@/lib/platform/branding";

function redirectToConnectors(query: Record<string, string>): NextResponse {
  const base = resolvePublicAppOrigin();
  const url = new URL("/jag/connectors", base);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirectToConnectors({ gws: "error", reason: oauthError });
  }
  if (!code || !state) {
    return redirectToConnectors({ gws: "error", reason: "missing_params" });
  }

  const parsed = parseGoogleWorkspaceOAuthState(state);
  if (!parsed) {
    return redirectToConnectors({ gws: "error", reason: "invalid_state" });
  }

  const session = await getJagPlatformSession();
  if (!session) {
    return redirectToConnectors({ gws: "error", reason: "unauthorized" });
  }
  if (session.userId !== parsed.userId) {
    return redirectToConnectors({ gws: "error", reason: "state_user_mismatch" });
  }
  if (!canAccessConnectorOrganization(session, parsed.organizationId)) {
    return redirectToConnectors({ gws: "error", reason: "forbidden_org" });
  }

  const tokens = await exchangeGoogleWorkspaceJagCode({
    code,
    userEmail: session.email,
    domain: session.email.split("@")[1],
  });
  if (!tokens.ok) {
    return redirectToConnectors({ gws: "error", reason: "token_exchange" });
  }

  saveGoogleWorkspaceTokens({
    organizationId: parsed.organizationId,
    tokens: tokens.tokens,
  });

  return redirectToConnectors({
    org: parsed.organizationId,
    gws: "connected",
  });
}
