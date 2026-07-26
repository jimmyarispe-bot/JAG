import type { EmailOtpType, User } from "@supabase/supabase-js";
import {
  PASSWORD_RESET_PATH,
  userMustResetPassword,
} from "@/lib/auth/must-reset-password";

export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Auth email types that must complete password setup before using the app. */
const PASSWORD_SETUP_TYPES = new Set<string>(["invite", "recovery"]);

/**
 * Absolute redirect target for Supabase `generateLink` / invite options.
 * Must be allow-listed in the Supabase project's redirect URL settings.
 */
export function authCallbackRedirectTo(appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}${AUTH_CALLBACK_PATH}`;
}

/**
 * SSR email link: app verifies `token_hash` via `verifyOtp` and writes session cookies.
 * Prefer this over Supabase `action_link` (implicit hash tokens are invisible to route handlers).
 */
export function buildEmailAuthCallbackLink(input: {
  appUrl: string;
  tokenHash: string;
  type: Extract<EmailOtpType, "invite" | "recovery" | "magiclink" | "signup" | "email">;
  next?: string;
}): string {
  const url = new URL(authCallbackRedirectTo(input.appUrl));
  url.searchParams.set("token_hash", input.tokenHash);
  url.searchParams.set("type", input.type);
  if (input.next) {
    url.searchParams.set("next", input.next);
  }
  return url.toString();
}

/** Reject open redirects; allow only same-origin relative paths. */
export function safeInternalPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return fallback;
  }
  return trimmed;
}

export function isPasswordSetupAuthType(type: string | null | undefined): boolean {
  return Boolean(type && PASSWORD_SETUP_TYPES.has(type));
}

/**
 * After a successful invite/recovery (or must_reset_password gate), send the user
 * to password setup; otherwise honor a safe `next` path.
 */
export function resolveAuthCallbackRedirect(input: {
  type: string | null | undefined;
  next: string | null | undefined;
  user: User | null | undefined;
}): string {
  const safeNext = safeInternalPath(input.next, "/dashboard");
  const destinationAfterPassword =
    safeNext === PASSWORD_RESET_PATH || safeNext.startsWith(`${PASSWORD_RESET_PATH}/`)
      ? "/dashboard"
      : safeNext;

  if (isPasswordSetupAuthType(input.type) || userMustResetPassword(input.user)) {
    return `${PASSWORD_RESET_PATH}?next=${encodeURIComponent(destinationAfterPassword)}`;
  }

  return safeNext;
}

export type AuthCallbackExchangeResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

type AuthExchanger = {
  auth: {
    exchangeCodeForSession: (
      code: string
    ) => Promise<{ data: { user: User | null }; error: { message: string } | null }>;
    verifyOtp: (params: {
      type: EmailOtpType;
      token_hash: string;
    }) => Promise<{ data: { user: User | null }; error: { message: string } | null }>;
  };
};

/** Exchange PKCE `code` or email `token_hash` for a session user. */
export async function exchangeAuthCallbackParams(
  supabase: AuthExchanger,
  params: {
    code: string | null;
    tokenHash: string | null;
    type: string | null;
  }
): Promise<AuthCallbackExchangeResult> {
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "Session exchange returned no user" };
    return { ok: true, user: data.user };
  }

  if (params.tokenHash && params.type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: params.type as EmailOtpType,
      token_hash: params.tokenHash,
    });
    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "OTP verification returned no user" };
    return { ok: true, user: data.user };
  }

  return { ok: false, error: "Missing code or token_hash" };
}
