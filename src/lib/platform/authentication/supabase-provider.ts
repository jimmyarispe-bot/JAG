/**
 * Supabase AuthenticationProvider — the ONLY module that may call
 * `supabase.auth` / `auth.admin` (Sprint 060C).
 */

import type { EmailOtpType, SupabaseClient, User } from "@supabase/supabase-js";
import type { AuthenticationProvider } from "@/lib/platform/authentication/provider";
import type {
  AuthResult,
  AuthSession,
  AuthUser,
  AuthUserMetadata,
  CreateAuthUserInput,
  GenerateLinkOptions,
  GenerateLinkResult,
  MfaEnrollResult,
  MfaFactor,
  SignInWithPasswordInput,
  UpdateAuthUserInput,
} from "@/lib/platform/authentication/types";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

type AnySupabase = SupabaseClient;

function mapUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    phone: user.phone ?? null,
    createdAt: user.created_at,
    updatedAt: user.updated_at ?? null,
    userMetadata: (user.user_metadata ?? {}) as AuthUserMetadata,
    appMetadata: (user.app_metadata ?? {}) as AuthUserMetadata,
  };
}

function mapSession(session: {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: User;
} | null): AuthSession | null {
  if (!session?.user) return null;
  const user = mapUser(session.user);
  if (!user) return null;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt: session.expires_at ?? null,
    user,
  };
}

function fail<T>(error: string): AuthResult<T> {
  return { ok: false, error };
}

function ok<T>(data: T): AuthResult<T> {
  return { ok: true, data };
}

function mapFactor(f: {
  id: string;
  factor_type: string;
  status: string;
  friendly_name?: string;
}): MfaFactor {
  return {
    id: f.id,
    factorType: f.factor_type,
    status: f.status,
    friendlyName: f.friendly_name ?? null,
  };
}

async function generateLink(
  admin: AnySupabase,
  type: "invite" | "recovery",
  email: string,
  options?: GenerateLinkOptions
): Promise<AuthResult<GenerateLinkResult>> {
  const linkOptions: {
    redirectTo?: string;
    data?: AuthUserMetadata;
  } = {};
  if (options?.redirectTo) linkOptions.redirectTo = options.redirectTo;
  if (options?.data) linkOptions.data = options.data;
  const { data, error } = await admin.auth.admin.generateLink({
    type,
    email,
    ...(Object.keys(linkOptions).length > 0 ? { options: linkOptions } : {}),
  });
  if (error) return fail(error.message);
  const tokenHash = data.properties?.hashed_token;
  if (!tokenHash) return fail("Link generation did not return a token hash");
  return ok({
    tokenHash,
    actionLink: data.properties?.action_link ?? null,
  });
}

/** Shared factory — server module wires cookie/admin clients; browser never imports server-auth. */
export function createSupabaseAuthenticationProvider(
  getUserClient: () => Promise<AnySupabase> | AnySupabase,
  getAdminClient: () => AnySupabase
): AuthenticationProvider {
  const userClient = async () => await getUserClient();

  return {
    id: "supabase",

    async signInWithPassword(input: SignInWithPasswordInput) {
      const client = await userClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) return fail(error.message);
      const user = mapUser(data.user);
      if (!user) return fail("Sign-in returned no user");
      return ok({ user, session: mapSession(data.session) });
    },

    async signOut() {
      const client = await userClient();
      const { error } = await client.auth.signOut();
      if (error) return fail(error.message);
      return ok(null);
    },

    async refreshSession() {
      const client = await userClient();
      const { data, error } = await client.auth.refreshSession();
      if (error) return fail(error.message);
      const user = mapUser(data.user);
      if (!user) return fail("Refresh returned no user");
      return ok({ user, session: mapSession(data.session) });
    },

    async getCurrentUser() {
      const client = await userClient();
      const { data } = await client.auth.getUser();
      return mapUser(data.user);
    },

    async getCurrentSession() {
      const client = await userClient();
      const { data } = await client.auth.getSession();
      return mapSession(data.session);
    },

    async updatePassword(password: string, metadata?: AuthUserMetadata) {
      return this.updateUser({ password, data: metadata });
    },

    async updateUser(input: UpdateAuthUserInput) {
      const client = await userClient();
      const { data, error } = await client.auth.updateUser({
        password: input.password,
        email: input.email,
        data: input.data,
      });
      if (error) return fail(error.message);
      const user = mapUser(data.user);
      if (!user) return fail("Update returned no user");
      return ok(user);
    },

    async verifyInvite(tokenHash: string) {
      return verifyOtp(await userClient(), "invite", tokenHash);
    },

    async verifyRecovery(tokenHash: string) {
      return verifyOtp(await userClient(), "recovery", tokenHash);
    },

    async verifyEmailToken(type: string, tokenHash: string) {
      return verifyOtp(await userClient(), type as EmailOtpType, tokenHash);
    },

    async exchangeCodeForSession(code: string) {
      const client = await userClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) return fail(error.message);
      const user = mapUser(data.user);
      if (!user) return fail("Code exchange returned no user");
      return ok({ user });
    },

    async generateInvite(email: string, options?: GenerateLinkOptions) {
      return generateLink(getAdminClient(), "invite", email, options);
    },

    async generateRecovery(email: string, options?: GenerateLinkOptions) {
      return generateLink(getAdminClient(), "recovery", email, options);
    },

    async createUser(input: CreateAuthUserInput) {
      const admin = getAdminClient();
      const { data, error } = await admin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: input.emailConfirm,
        user_metadata: input.userMetadata,
        ...(input.banDuration ? { ban_duration: input.banDuration } : {}),
      });
      if (error) return fail(error.message);
      const user = mapUser(data.user);
      if (!user) return fail("Create user returned no user");
      return ok(user);
    },

    async deleteUser(userId: string) {
      const { error } = await getAdminClient().auth.admin.deleteUser(userId);
      if (error) return fail(error.message);
      return ok(null);
    },

    async updateMetadata(userId: string, metadata: AuthUserMetadata) {
      const { data: existing, error: getError } =
        await getAdminClient().auth.admin.getUserById(userId);
      if (getError) return fail(getError.message);
      const { data, error } = await getAdminClient().auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            ...(existing.user?.user_metadata ?? {}),
            ...metadata,
          },
        }
      );
      if (error) return fail(error.message);
      const user = mapUser(data.user);
      if (!user) return fail("Update metadata returned no user");
      return ok(user);
    },

    async setUserBanned(
      userId: string,
      banned: boolean,
      metadata?: AuthUserMetadata
    ) {
      const { data: existing, error: getError } =
        await getAdminClient().auth.admin.getUserById(userId);
      if (getError) return fail(getError.message);
      const { data, error } = await getAdminClient().auth.admin.updateUserById(
        userId,
        {
          ban_duration: banned ? "876000h" : "none",
          user_metadata: {
            ...(existing.user?.user_metadata ?? {}),
            ...(metadata ?? {}),
          },
        }
      );
      if (error) return fail(error.message);
      const user = mapUser(data.user);
      if (!user) return fail("setUserBanned returned no user");
      return ok(user);
    },

    async getUserById(userId: string) {
      const { data, error } = await getAdminClient().auth.admin.getUserById(userId);
      if (error) return fail(error.message);
      return ok(mapUser(data.user));
    },

    async mfaGetAssuranceLevel() {
      const client = await userClient();
      const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) return fail(error.message);
      return ok({
        currentLevel: data.currentLevel ?? null,
        nextLevel: data.nextLevel ?? null,
      });
    },

    async mfaListFactors() {
      const client = await userClient();
      const { data, error } = await client.auth.mfa.listFactors();
      if (error) return fail(error.message);
      return ok({
        totp: (data.totp ?? []).map(mapFactor),
        all: (data.all ?? []).map(mapFactor),
      });
    },

    async mfaEnrollTotp(friendlyName: string) {
      const client = await userClient();
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });
      if (error || !data) return fail(error?.message ?? "MFA enroll failed");
      return ok({
        id: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      } satisfies MfaEnrollResult);
    },

    async mfaUnenroll(factorId: string) {
      const client = await userClient();
      const { error } = await client.auth.mfa.unenroll({ factorId });
      if (error) return fail(error.message);
      return ok(null);
    },

    async mfaChallengeAndVerify(factorId: string, code: string) {
      const client = await userClient();
      const { error } = await client.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error) return fail(error.message);
      return ok(null);
    },
  };
}

async function verifyOtp(
  client: AnySupabase,
  type: EmailOtpType,
  tokenHash: string
): Promise<AuthResult<{ user: AuthUser }>> {
  const { data, error } = await client.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (error) return fail(error.message);
  const user = mapUser(data.user);
  if (!user) return fail("OTP verification returned no user");
  return ok({ user });
}

/** Browser (client components): cookie session via anon key. No next/headers. */
export function createBrowserAuthenticationProvider(): AuthenticationProvider {
  return createSupabaseAuthenticationProvider(
    () => createBrowserSupabase(),
    () => {
      throw new Error("Admin auth APIs are not available in the browser provider");
    }
  );
}

/**
 * Edge middleware: use an already-constructed SSR client for getUser only.
 * Keeps cookie wiring in middleware; auth read goes through this module.
 */
export async function getUserFromAuthClient(
  client: Pick<AnySupabase, "auth">
): Promise<AuthUser | null> {
  const { data } = await client.auth.getUser();
  return mapUser(data.user);
}

/** Legacy Supabase User shape for gradual migration of domain call sites. */
export async function getLegacyUserFromAuthClient(
  client: Pick<AnySupabase, "auth">
): Promise<User | null> {
  const mapped = await getUserFromAuthClient(client);
  return mapped ? toLegacySupabaseUser(mapped) : null;
}

/** Map provider user → Supabase-shaped user for legacy SessionUser / identity code. */
export function toLegacySupabaseUser(user: AuthUser): User {
  return {
    id: user.id,
    email: user.email ?? undefined,
    email_confirmed_at: user.emailConfirmedAt ?? undefined,
    phone: user.phone ?? undefined,
    created_at: user.createdAt,
    updated_at: user.updatedAt ?? undefined,
    user_metadata: user.userMetadata,
    app_metadata: user.appMetadata,
    aud: "authenticated",
    role: "authenticated",
    identities: [],
  } as User;
}

export { mapUser as mapSupabaseUserToAuthUser };
