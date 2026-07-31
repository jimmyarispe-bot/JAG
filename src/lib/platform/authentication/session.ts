import { cache } from "react";
import { AuthenticationService } from "@/lib/platform/authentication/authentication-service";
import { createServerAuthenticationProvider } from "@/lib/platform/authentication/supabase-provider-server";
import type { AuthSession, AuthUser } from "@/lib/platform/authentication/types";
import {
  toLegacySupabaseUser,
} from "@/lib/platform/authentication/supabase-provider";
import { createAuthClient } from "@/lib/supabase/server-auth";

function getServerAuthenticationService(): AuthenticationService {
  return new AuthenticationService(createServerAuthenticationProvider());
}

/**
 * Platform auth identity for the current request (provider-agnostic).
 * Prefer this over calling provider APIs from feature modules.
 */
export type PlatformAuthContext = {
  user: AuthUser | null;
  session: AuthSession | null;
  /** Cookie-bound data client for Postgres/RLS — not an auth API surface. */
  dataClient: Awaited<ReturnType<typeof createAuthClient>>;
};

/**
 * Single request-scoped auth context. Feature code should use this
 * instead of resolving authentication independently.
 */
export const getPlatformAuthContext = cache(
  async (): Promise<PlatformAuthContext> => {
    const auth = getServerAuthenticationService();
    const dataClient = await createAuthClient();
    const [user, session] = await Promise.all([
      auth.getCurrentUser(),
      auth.getCurrentSession(),
    ]);
    return { user, session, dataClient };
  }
);

/**
 * Compatibility bridge: AuthUser + data client shaped like legacy getAuthUser().
 */
export const getPlatformAuthUser = cache(async () => {
  const ctx = await getPlatformAuthContext();
  return {
    supabase: ctx.dataClient,
    user: ctx.user ? toLegacySupabaseUser(ctx.user) : null,
    authUser: ctx.user,
  };
});
