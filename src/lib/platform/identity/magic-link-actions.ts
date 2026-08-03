"use server";

import { headers } from "next/headers";
import { JAG_PLATFORM_HOME_PATH } from "@/lib/jag-platform/auth";
import { requestJagMagicLinkViaAuthEmail } from "@/lib/platform/auth-email";
import {
  checkRateLimitAsync,
  getClientIpFromHeaders,
} from "@/lib/platform/api-rate-limit";

/**
 * JAG portal magic-link request — Admin generateLink + Resend (never client OTP mailer).
 *
 * Rate limits silently return the same neutral success so throttling cannot
 * be used to probe account existence.
 */
export async function requestJagMagicLinkAction(input: {
  email: string;
  /** Untrusted browser origin hint (validated server-side). */
  originHint?: string;
  /** Safe post-auth JAG destination (defaults to `/jag`). */
  next?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const byIp = await checkRateLimitAsync(`magiclink:ip:${ip}`, 8, 60_000);
  const byEmail = await checkRateLimitAsync(
    `magiclink:email:${email}`,
    5,
    15 * 60_000
  );
  if (!byIp.ok || !byEmail.ok) {
    return { ok: true };
  }

  const next =
    input.next && input.next.startsWith("/jag") && !input.next.startsWith("//")
      ? input.next
      : JAG_PLATFORM_HOME_PATH;

  return requestJagMagicLinkViaAuthEmail({
    email,
    next,
    originHint: input.originHint,
  });
}
