import { QUICKBOOKS_OAUTH_SCOPES } from "@/lib/platform/integrations/connectors/quickbooks/auth";

export function quickbooksClientConfig(): {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly environment: "sandbox" | "production";
  readonly configured: boolean;
  readonly redirectUri: string;
} {
  const clientId = (
    process.env.QUICKBOOKS_CLIENT_ID ||
    process.env.INTUIT_CLIENT_ID ||
    ""
  ).trim();
  const clientSecret = (
    process.env.QUICKBOOKS_CLIENT_SECRET ||
    process.env.INTUIT_CLIENT_SECRET ||
    ""
  ).trim();
  const environment =
    process.env.QUICKBOOKS_ENVIRONMENT === "production"
      ? "production"
      : "sandbox";
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return {
    clientId,
    clientSecret,
    environment,
    configured: Boolean(clientId && clientSecret),
    redirectUri: `${base}/api/jag-platform/connectors/quickbooks/callback`,
  };
}

export function quickbooksAuthorizeUrl(input: {
  readonly state: string;
  readonly clientId: string;
  readonly redirectUri: string;
}): string {
  const url = new URL("https://appcenter.intuit.com/connect/oauth2");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", QUICKBOOKS_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", input.state);
  return url.toString();
}
