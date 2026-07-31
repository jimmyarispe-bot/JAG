import { GOOGLE_WORKSPACE_OAUTH_SCOPES } from "@/lib/platform/integrations/connectors/google-workspace/auth/oauth";

export function googleWorkspaceJagClientConfig(): {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly configured: boolean;
  readonly redirectUri: string;
} {
  const clientId = (
    process.env.GOOGLE_WORKSPACE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    ""
  ).trim();
  const clientSecret = (
    process.env.GOOGLE_WORKSPACE_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    ""
  ).trim();
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
    redirectUri: `${base}/api/jag-platform/connectors/google/callback`,
  };
}

export function googleWorkspaceJagAuthorizeUrl(input: {
  readonly state: string;
  readonly clientId: string;
  readonly redirectUri: string;
}): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_WORKSPACE_OAUTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export { GOOGLE_WORKSPACE_OAUTH_SCOPES };
