/**
 * Shared AuthClient type without importing next/headers (server-auth).
 * Use this for type-only annotations in modules that may be pulled into client graphs.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthClient = SupabaseClient;
