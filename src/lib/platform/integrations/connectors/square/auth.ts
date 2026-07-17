/**
 * Square OAuth 2.0 configuration — sandbox and production.
 * Live token exchange uses these endpoints; demo client uses structured placeholders.
 */

import type { OAuth2Config } from "@/lib/platform/integrations/common/auth";
import type { SquareEnvironment } from "./entities";

export const SQUARE_OAUTH_SCOPES = [
  "PAYMENTS_READ",
  "ORDERS_READ",
  "CUSTOMERS_READ",
  "ITEMS_READ",
  "INVOICES_READ",
  "SUBSCRIPTIONS_READ",
  "GIFTCARDS_READ",
  "MERCHANT_PROFILE_READ",
  "DEVICE_CREDENTIAL_MANAGEMENT",
] as const;

export function squareOAuthConfig(
  environment: SquareEnvironment,
  input: {
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
  }
): OAuth2Config {
  const base =
    environment === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  return {
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    authorizationUrl: `${base}/oauth2/authorize`,
    tokenUrl: `${base}/oauth2/token`,
    scopes: [...SQUARE_OAUTH_SCOPES],
    redirectUri: input.redirectUri,
  };
}

export type SquareMerchant = {
  merchantId: string;
  businessName: string;
  country: string;
  currency: string;
  mainLocationId: string | null;
};

export type SquareAuthSession = {
  environment: SquareEnvironment;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  merchantId: string;
  merchants: SquareMerchant[];
};
