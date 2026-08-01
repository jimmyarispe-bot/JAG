import {
  authCallbackRedirectTo,
  buildEmailAuthCallbackLink,
} from "@/lib/auth/auth-callback";
import { CANONICAL_JAG_PRODUCTION_ORIGIN } from "@/lib/platform/branding";
import type { EmailOtpType } from "@supabase/supabase-js";

export type AuthEmailLinkType = Extract<
  EmailOtpType,
  "invite" | "recovery" | "magiclink" | "signup" | "email"
>;

export { CANONICAL_JAG_PRODUCTION_ORIGIN };

/**
 * Public app origin for auth callback links (no trailing slash).
 *
 * Production: set `NEXT_PUBLIC_APP_URL=https://www.thejag.org`
 * (see `CANONICAL_JAG_PRODUCTION_ORIGIN`). Preview/local keep their own origins.
 */
export function resolveAuthAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** True when the resolved app URL is the canonical JAG www production origin. */
export function isCanonicalJagProductionAppUrl(
  appUrl = resolveAuthAppUrl()
): boolean {
  return appUrl.replace(/\/$/, "") === CANONICAL_JAG_PRODUCTION_ORIGIN;
}

/** Absolute redirectTo for Supabase generateLink allow-list. */
export function authEmailRedirectTo(appUrl = resolveAuthAppUrl()): string {
  return authCallbackRedirectTo(appUrl);
}

/**
 * Build the user-facing link that hits /auth/callback with token_hash.
 * Prefer this over Supabase action_link so the app owns the email URL.
 */
export function buildAuthEmailCallbackLink(input: {
  tokenHash: string;
  type: AuthEmailLinkType;
  next?: string;
  appUrl?: string;
}): string {
  return buildEmailAuthCallbackLink({
    appUrl: input.appUrl ?? resolveAuthAppUrl(),
    tokenHash: input.tokenHash,
    type: input.type,
    next: input.next,
  });
}

export function buildLoginLink(appUrl = resolveAuthAppUrl()): string {
  return `${appUrl}/login`;
}
