import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export const PASSWORD_RESET_PATH = "/login/reset-required";

type AuthUser = { user_metadata?: Record<string, unknown> } | null | undefined;

export function userMustResetPassword(user: AuthUser): boolean {
  return user?.user_metadata?.must_reset_password === true;
}

/** Page routes: redirect before protected layouts render. */
export function redirectIfPasswordResetRequired(user: AuthUser, nextPath: string): void {
  if (userMustResetPassword(user)) {
    redirect(`${PASSWORD_RESET_PATH}?next=${encodeURIComponent(nextPath)}`);
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
]);

export function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return true;
  return false;
}

export function isPasswordResetExemptPath(pathname: string): boolean {
  return pathname === PASSWORD_RESET_PATH || pathname.startsWith(`${PASSWORD_RESET_PATH}/`);
}
