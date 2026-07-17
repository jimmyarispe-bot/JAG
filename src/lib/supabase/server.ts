import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * B.1 — User-scoped server client (anon key only).
 * Prefer `@/lib/supabase/server-auth` (cookie session) for request paths.
 * This helper has no user JWT — only use for public/anon server work.
 */
export function createAnonServerClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Explicit service-role client — bypasses RLS.
 * Never use on end-user request paths. Admin/cron/scripts only.
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * @deprecated B.1 — Do not use. Prefer createAuthClient() or createAnonServerClient().
 * Kept temporarily so accidental imports fail closed without service role.
 */
export function createServerClient(): SupabaseClient<Database> {
  return createAnonServerClient();
}
