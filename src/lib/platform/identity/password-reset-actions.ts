"use server";

import { headers } from "next/headers";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { requestPasswordResetViaAuthEmail } from "@/lib/platform/auth-email";
import {
  checkRateLimitAsync,
  getClientIpFromHeaders,
} from "@/lib/platform/api-rate-limit";

/**
 * Self-serve forgot password — Supabase generates the recovery token;
 * JAG Auth Email Service delivers the branded message (never Supabase SMTP).
 */
export async function requestPasswordResetAction(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return requestPasswordResetViaAuthEmail({ email });
}

/**
 * JAG portal forgot password — Resend/auth-email with next=/jag/login.
 *
 * Rate limits silently return the same neutral success so throttling cannot
 * be used to probe account existence.
 */
export async function requestJagPasswordResetAction(input: {
  email: string;
  /** Untrusted browser origin hint (validated server-side). */
  originHint?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const byIp = await checkRateLimitAsync(`pwdreset:ip:${ip}`, 8, 60_000);
  const byEmail = await checkRateLimitAsync(
    `pwdreset:email:${email}`,
    5,
    15 * 60_000
  );
  if (!byIp.ok || !byEmail.ok) {
    return { ok: true };
  }

  return requestPasswordResetViaAuthEmail({
    email,
    next: JAG_PLATFORM_LOGIN_PATH,
    originHint: input.originHint,
    brandProfile: "jag",
  });
}
