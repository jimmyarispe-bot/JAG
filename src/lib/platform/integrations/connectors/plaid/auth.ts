/**
 * Plaid Link + Item auth — sandbox, development, production.
 */

import type { OAuth2Config } from "@/lib/platform/integrations/common/auth";
import type { PlaidEnvironment } from "./entities";

export const PLAID_LINK_PRODUCTS = [
  "transactions",
  "auth",
  "identity",
  "liabilities",
  "investments",
] as const;

export function plaidLinkConfig(
  environment: PlaidEnvironment,
  input: {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
  }
): OAuth2Config {
  const host =
    environment === "production"
      ? "https://production.plaid.com"
      : environment === "development"
        ? "https://development.plaid.com"
        : "https://sandbox.plaid.com";

  return {
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    authorizationUrl: `${host}/link/token/create`,
    tokenUrl: `${host}/item/public_token/exchange`,
    scopes: [...PLAID_LINK_PRODUCTS],
    redirectUri: input.redirectUri,
  };
}

export type PlaidInstitution = {
  institutionId: string;
  name: string;
  products: string[];
  countryCodes: string[];
};

export type PlaidAuthSession = {
  environment: PlaidEnvironment;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  itemId: string;
  institutionId: string;
  institutions: PlaidInstitution[];
  linkToken: string;
};
