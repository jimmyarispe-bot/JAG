"use server";

import { createAuthClient } from "@/lib/supabase/server-auth";
import { getLegacyUserFromAuthClient } from "@/lib/platform/authentication";
import { markMfaMethodEnabled } from "@/lib/platform/identity/mfa";

/** Persist TOTP enrollment via platform identity (not client Supabase). */
export async function markTotpEnabledAction(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createAuthClient();
  const user = await getLegacyUserFromAuthClient(supabase);
  if (!user) {
    return { error: "Unauthorized" };
  }

  await markMfaMethodEnabled(supabase, user.id, "totp");
  return { ok: true };
}
