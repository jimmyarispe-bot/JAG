/**
 * Request-scoped Supabase auth user (Sprint P002).
 * Kept separate from session.ts so branding/org loaders can share getUser
 * without circular imports through branding.
 */

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createAuthClient } from "@/lib/supabase/server-auth";

/** Single getUser() per React request — shared by session, identity, branding, org. */
export const getAuthUser = cache(async (): Promise<{
  supabase: Awaited<ReturnType<typeof createAuthClient>>;
  user: User | null;
}> => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
});
