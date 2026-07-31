import { NextResponse } from "next/server";
import {
  canAccessConnectorOrganization,
  exchangeQuickBooksAuthorizationCode,
  parseQuickBooksOAuthState,
  saveQuickBooksTokens,
} from "@/lib/connectors";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

function redirectToConnectors(query: Record<string, string>): NextResponse {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const url = new URL("/jag/connectors", base);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

/**
 * GET — Intuit OAuth callback.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const realmId = searchParams.get("realmId");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirectToConnectors({ qbo: "error", reason: oauthError });
  }
  if (!code || !state || !realmId) {
    return redirectToConnectors({ qbo: "error", reason: "missing_params" });
  }

  const parsed = parseQuickBooksOAuthState(state);
  if (!parsed) {
    return redirectToConnectors({ qbo: "error", reason: "invalid_state" });
  }

  const session = await getJagPlatformSession();
  if (!session) {
    return redirectToConnectors({ qbo: "error", reason: "unauthorized" });
  }
  if (session.userId !== parsed.userId) {
    return redirectToConnectors({ qbo: "error", reason: "state_user_mismatch" });
  }
  if (!canAccessConnectorOrganization(session, parsed.organizationId)) {
    return redirectToConnectors({ qbo: "error", reason: "forbidden_org" });
  }

  const tokens = await exchangeQuickBooksAuthorizationCode({
    code,
    realmId,
  });
  if (!tokens.ok) {
    return redirectToConnectors({ qbo: "error", reason: "token_exchange" });
  }

  saveQuickBooksTokens({
    organizationId: parsed.organizationId,
    tokens: tokens.tokens,
  });

  return redirectToConnectors({
    org: parsed.organizationId,
    qbo: "connected",
  });
}
