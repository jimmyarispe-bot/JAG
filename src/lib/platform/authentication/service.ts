import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthenticationService } from "@/lib/platform/authentication/authentication-service";
import {
  createAdminAuthenticationProvider,
  createCookieBoundAuthenticationProvider,
  createServerAuthenticationProvider,
} from "@/lib/platform/authentication/supabase-provider-server";

export { AuthenticationService } from "@/lib/platform/authentication/authentication-service";

/** RSC / Server Actions — per-call server provider (cookie + admin). */
export function getServerAuthenticationService(): AuthenticationService {
  return new AuthenticationService(createServerAuthenticationProvider());
}

/** Service-role admin operations (invites, recovery tokens, provisioning). */
export function getAdminAuthenticationService(): AuthenticationService {
  return new AuthenticationService(createAdminAuthenticationProvider());
}

/** Route handlers with a custom cookie-bound Supabase client (auth callback). */
export function getCookieBoundAuthenticationService(
  client: SupabaseClient
): AuthenticationService {
  return new AuthenticationService(
    createCookieBoundAuthenticationProvider(client)
  );
}

export type {
  AuthResult,
  AuthSession,
  AuthUser,
  GenerateLinkResult,
} from "@/lib/platform/authentication/types";
