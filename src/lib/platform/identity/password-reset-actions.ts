"use server";

import { requestPasswordResetViaAuthEmail } from "@/lib/platform/auth-email";

/**
 * Self-serve forgot password — Supabase generates the recovery token;
 * JAG Auth Email Service delivers the branded message (never Supabase SMTP).
 */
export async function requestPasswordResetAction(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return requestPasswordResetViaAuthEmail({ email });
}
