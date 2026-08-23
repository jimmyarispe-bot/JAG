import {
  authCallbackRedirectTo,
  buildEmailAuthCallbackLink,
  safeInternalPath,
} from "@/lib/auth/auth-callback";
import {
  CANONICAL_JAG_PRODUCTION_ORIGIN,
  DEFAULT_ROOT_DOMAIN,
  resolvePublicAppOrigin,
} from "@/lib/platform/branding";
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
  return resolvePublicAppOrigin();
}

/** True when the resolved app URL is the canonical JAG www production origin. */
export function isCanonicalJagProductionAppUrl(
  appUrl = resolveAuthAppUrl()
): boolean {
  return appUrl.replace(/\/$/, "") === CANONICAL_JAG_PRODUCTION_ORIGIN;
}

function configuredOrigins(): Set<string> {
  const origins = new Set<string>();
  const add = (raw: string | undefined) => {
    if (!raw) return;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      // ignore malformed env
    }
  };
  add(resolveAuthAppUrl());
  add(CANONICAL_JAG_PRODUCTION_ORIGIN);
  add(process.env.NEXT_PUBLIC_SITE_URL);
  add("https://thejag.org");
  add("https://www.thejag.org");
  return origins;
}

/**
 * Hosts we own: the platform root and any tenant subdomain beneath it.
 *
 * A subscriber signing in at `academy.thejag.org` must get a reset link on
 * their own host. Without this the origin hint is rejected and the link falls
 * back to the JAG apex, sending Academy staff to the wrong front door.
 */
function isPlatformRootHost(host: string): boolean {
  const root = DEFAULT_ROOT_DOMAIN;
  return host === root || host.endsWith(`.${root}`);
}

function allowPreviewDeploymentHosts(): boolean {
  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.VERCEL_ENV === "development") return true;
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.NODE_ENV === "test") return true;
  return false;
}

/**
 * Resolve the app origin used in recovery/invite email links.
 *
 * `clientOriginHint` is untrusted. It is accepted only when it matches a
 * configured application origin, or (on Preview/dev) a `*.vercel.app` /
 * localhost deployment host. Production never accepts arbitrary hosts.
 */
export function resolveTrustedAuthAppUrl(
  clientOriginHint?: string | null
): string {
  const configured = resolveAuthAppUrl();
  if (!clientOriginHint || typeof clientOriginHint !== "string") {
    return configured;
  }

  let parsed: URL;
  try {
    parsed = new URL(clientOriginHint.trim());
  } catch {
    return configured;
  }

  if (parsed.username || parsed.password) return configured;
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return configured;
  }

  const host = parsed.hostname.toLowerCase();
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  if (parsed.protocol === "http:" && !isLocal) return configured;
  if (parsed.protocol === "https:" && isLocal) return configured;

  const origin = parsed.origin;
  if (configuredOrigins().has(origin)) return origin;
  if (parsed.protocol === "https:" && isPlatformRootHost(host)) return origin;

  if (allowPreviewDeploymentHosts()) {
    if (isLocal && parsed.protocol === "http:") return origin;
    if (host.endsWith(".vercel.app") && parsed.protocol === "https:") {
      return origin;
    }
  }

  return configured;
}

/**
 * Optional post-auth `next` path for email callback links.
 * Invalid / external values are omitted (not rewritten to a wrong default).
 */
export function safeAuthEmailNext(
  next?: string | null
): string | undefined {
  if (!next) return undefined;
  const trimmed = next.trim();
  if (!trimmed) return undefined;
  const safe = safeInternalPath(trimmed, "");
  // safeInternalPath falls back when invalid — treat empty / mismatch as omit.
  if (!safe || safe !== trimmed) return undefined;
  if (!safe.startsWith("/") || safe.startsWith("//")) return undefined;
  return safe;
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
  const next = safeAuthEmailNext(input.next);
  return buildEmailAuthCallbackLink({
    appUrl: input.appUrl ?? resolveAuthAppUrl(),
    tokenHash: input.tokenHash,
    type: input.type,
    next,
  });
}

export function buildLoginLink(appUrl = resolveAuthAppUrl()): string {
  return `${appUrl}/login`;
}
