/**
 * Authentication surface probes — Sprint 210.
 * Deterministic file/route existence checks. No network.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AuthCheck } from "./types";

function probe(id: string, label: string, relativePath: string): AuthCheck {
  const path = join(process.cwd(), relativePath);
  const ok = existsSync(path);
  return {
    id,
    label,
    ok,
    path: relativePath,
    detail: ok
      ? `Present: ${relativePath}`
      : `Missing auth surface: ${relativePath}`,
  };
}

/**
 * Probe invite activate, forgot/reset, MFA, login, callback, JAG auth APIs,
 * session modules, and identity action modules.
 */
export function runAuthValidation(): readonly AuthCheck[] {
  return [
    probe(
      "auth.invite-activate",
      "Invite activate (/login/activate)",
      "src/app/login/activate/page.tsx"
    ),
    probe(
      "auth.forgot",
      "Forgot password (/login/forgot)",
      "src/app/login/forgot/page.tsx"
    ),
    probe(
      "auth.reset-required",
      "Reset required (/login/reset-required)",
      "src/app/login/reset-required/page.tsx"
    ),
    probe(
      "auth.mfa-required",
      "MFA required (/login/mfa-required)",
      "src/app/login/mfa-required/page.tsx"
    ),
    probe("auth.login", "Login (/login)", "src/app/login/page.tsx"),
    probe(
      "auth.callback-module",
      "Auth callback module",
      "src/lib/auth/auth-callback.ts"
    ),
    probe(
      "auth.callback-route",
      "Auth callback route",
      "src/app/auth/callback/route.ts"
    ),
    probe(
      "auth.jag-login-api",
      "JAG login API",
      "src/app/api/jag-platform/auth/login/route.ts"
    ),
    probe(
      "auth.jag-logout-api",
      "JAG logout API",
      "src/app/api/jag-platform/auth/logout/route.ts"
    ),
    probe(
      "auth.jag-login-ui",
      "JAG login UI",
      "src/app/jag/login/page.tsx"
    ),
    probe(
      "auth.session-academy",
      "Academy session module",
      "src/lib/auth/session.ts"
    ),
    probe(
      "auth.session-jag",
      "JAG platform session module",
      "src/lib/jag-platform/session.ts"
    ),
    probe(
      "auth.password-reset-actions",
      "Password reset actions",
      "src/lib/platform/identity/password-reset-actions.ts"
    ),
    probe(
      "auth.invite-activation-actions",
      "Invite activation actions",
      "src/lib/platform/identity/invite-activation-actions.ts"
    ),
    probe(
      "auth.mfa-enforce",
      "MFA enforce module",
      "src/lib/platform/identity/mfa-enforce.ts"
    ),
  ];
}
