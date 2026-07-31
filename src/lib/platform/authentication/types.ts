/**
 * JAG Authentication Service — provider-agnostic types (Sprint 060C).
 * Applications consume these shapes; never Supabase SDK auth types directly.
 */

export type AuthUserMetadata = Record<string, unknown>;

export type AuthUser = {
  id: string;
  email: string | null;
  emailConfirmedAt: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string | null;
  userMetadata: AuthUserMetadata;
  appMetadata: AuthUserMetadata;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  user: AuthUser;
};

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type SignInWithPasswordInput = {
  email: string;
  password: string;
};

export type GenerateLinkOptions = {
  redirectTo?: string;
  data?: AuthUserMetadata;
};

export type GenerateLinkResult = {
  tokenHash: string;
  /** Provider-native action URL — prefer app-built callback links in JAG. */
  actionLink: string | null;
};

export type CreateAuthUserInput = {
  email: string;
  password?: string;
  emailConfirm?: boolean;
  userMetadata?: AuthUserMetadata;
  banDuration?: string;
};

export type UpdateAuthUserInput = {
  password?: string;
  data?: AuthUserMetadata;
  email?: string;
};

export type AuthProviderId =
  | "supabase"
  | "azure_ad"
  | "auth0"
  | "cognito"
  | "google_identity";

export type MfaFactor = {
  id: string;
  factorType: string;
  status: string;
  friendlyName?: string | null;
};

export type MfaEnrollResult = {
  id: string;
  qrCode: string;
  secret: string;
};
