/**
 * QuickBooks Online OAuth 2.0 — sandbox and production.
 */

import type { OAuth2Config } from "@/lib/platform/integrations/common/auth";
import type { QuickBooksEnvironment } from "./entities";

export const QUICKBOOKS_OAUTH_SCOPES = ["com.intuit.quickbooks.accounting"] as const;

export function quickbooksOAuthConfig(
  environment: QuickBooksEnvironment,
  input: {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
  }
): OAuth2Config {
  const authBase =
    environment === "production"
      ? "https://appcenter.intuit.com/connect/oauth2"
      : "https://appcenter.intuit.com/connect/oauth2";
  const tokenUrl = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

  return {
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    authorizationUrl: authBase,
    tokenUrl,
    scopes: [...QUICKBOOKS_OAUTH_SCOPES],
    redirectUri: input.redirectUri,
  };
}

export type QuickBooksCompany = {
  companyId: string;
  companyName: string;
  country: string;
  currency: string;
  fiscalYearStartMonth: number;
};

export type QuickBooksAuthSession = {
  environment: QuickBooksEnvironment;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  companyId: string;
  companies: QuickBooksCompany[];
};
