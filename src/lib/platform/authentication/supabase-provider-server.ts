/**
 * Server-only Supabase AuthenticationProvider factories.
 * Imports next/headers via createAuthClient — never import from Client Components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthenticationProvider } from "@/lib/platform/authentication/provider";
import { createSupabaseAuthenticationProvider } from "@/lib/platform/authentication/supabase-provider";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

type AnySupabase = SupabaseClient;

/** RSC / server actions: cookie-bound anon client + service role for admin. */
export function createServerAuthenticationProvider(): AuthenticationProvider {
  return createSupabaseAuthenticationProvider(
    () => createAuthClient(),
    () => createServiceRoleClient()
  );
}

/** Service-role only (scripts, auth-email, provisioning). */
export function createAdminAuthenticationProvider(): AuthenticationProvider {
  const admin = () => createServiceRoleClient();
  return createSupabaseAuthenticationProvider(admin, admin);
}

/**
 * Cookie-wired SSR client (e.g. /auth/callback route handler).
 * Admin ops still use service role.
 */
export function createCookieBoundAuthenticationProvider(
  client: AnySupabase
): AuthenticationProvider {
  return createSupabaseAuthenticationProvider(
    () => client,
    () => createServiceRoleClient()
  );
}
