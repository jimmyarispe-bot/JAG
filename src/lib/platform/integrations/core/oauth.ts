/**
 * OAuth2 helpers shared by connectors that select the oauth2 auth strategy.
 */

export type OAuth2Config = {
  readonly authorizationUrl: string;
  readonly tokenUrl: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
  readonly audience?: string;
};

export type OAuthAuthorizeParams = {
  readonly state: string;
  readonly codeChallenge?: string;
  readonly codeChallengeMethod?: "S256" | "plain";
  readonly extra?: Record<string, string>;
};

export function buildOAuthAuthorizeUrl(
  config: OAuth2Config,
  params: OAuthAuthorizeParams
): string {
  const url = new URL(config.authorizationUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", params.state);
  if (params.codeChallenge) {
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", params.codeChallengeMethod ?? "S256");
  }
  if (config.audience) {
    url.searchParams.set("audience", config.audience);
  }
  for (const [key, value] of Object.entries(params.extra ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function createOAuthState(prefix = "oauth"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
