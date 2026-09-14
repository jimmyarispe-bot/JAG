import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import {
  ACCOUNT_ACTIVATE_PATH,
  isPasswordSetupExemptPath,
  passwordSetupPathForUser,
  userNeedsInviteActivation,
} from "@/lib/auth/account-activation";

export const PASSWORD_RESET_PATH = "/login/reset-required";

type AuthUser = { user_metadata?: Record<string, unknown> } | null | undefined;

export function userMustResetPassword(user: AuthUser): boolean {
  return (
    user?.user_metadata?.must_reset_password === true ||
    userNeedsInviteActivation(user)
  );
}

/** Page routes: redirect before protected layouts render. */
export function redirectIfPasswordResetRequired(user: AuthUser, nextPath: string): void {
  if (userMustResetPassword(user)) {
    const path = passwordSetupPathForUser(user);
    redirect(`${path}?next=${encodeURIComponent(nextPath)}`);
  }
}

/** API routes: block authenticated access until password is changed. */
export function passwordResetRequiredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Password reset required before accessing this resource",
      code: "password_reset_required",
      redirectTo: PASSWORD_RESET_PATH,
    },
    { status: 403 }
  );
}

const PUBLIC_API_PATHS = new Set([
  "/api/integrations/docs",
  "/api/cloud/docs",
  "/api/data/docs",
  "/api/intelligence/docs",
  "/api/certification/reports",
  "/api/health",
  "/api/ready",
  // Deep ready stays public at the edge so CRON_SECRET bearer works without a
  // browser session; the route itself requires cron or ops authorization.
  "/api/ready/deep",
  "/api/observability/rum",
  // Same reasoning, and it was missing: Vercel cron sends `Authorization:
  // Bearer $CRON_SECRET` and no session cookie, so middleware answered 401
  // before either route could check that bearer. The daily queue run in
  // vercel.json has therefore never executed. Both routes verify CRON_SECRET
  // themselves, timing-safe, and fall back to a permission check.
  "/api/platform/process-queues",
  "/api/admissions/process-communications",
  /**
   * The public inquiry form's file upload — proof of income and proof of
   * eligibility, both required fields.
   *
   * WHY IT HAS TO BE HERE. Everyone who uses that form is, by definition,
   * somebody without an account. isProtectedApi treats every /api/ path as
   * protected unless it is named here, so middleware answered
   * {"error":"Unauthorized"} 401 before the route ever ran. File upload on the
   * public inquiry form had therefore never worked once, and since both
   * documents are required, no family who reached that section could submit —
   * proof of income being exactly what GA GOAL needs.
   *
   * Found 13 September 2026, by filling the form in as a family.
   *
   * WHY IT IS SAFE TO BE HERE. Public at the edge does not mean unguarded. The
   * route rate limits by IP, checks the content type against an allowlist,
   * enforces a size cap, generates its own storage path rather than trusting a
   * filename, and writes into a quarantine prefix that nothing is attached to
   * until the form is actually submitted. It is designed for anonymous callers,
   * which is the whole reason it exists as a route handler rather than a server
   * action — see the comment at the top of it.
   */
  "/api/apply/upload",
]);

export function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return true;
  return false;
}

export function isPasswordResetExemptPath(pathname: string): boolean {
  return isPasswordSetupExemptPath(pathname);
}

export { ACCOUNT_ACTIVATE_PATH, passwordSetupPathForUser, userNeedsInviteActivation };
