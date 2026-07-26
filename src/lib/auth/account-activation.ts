import { PASSWORD_RESET_PATH } from "@/lib/auth/must-reset-password";

/** First-time invite activation (distinct from password recovery). */
export const ACCOUNT_ACTIVATE_PATH = "/login/activate";

type AuthUser = { user_metadata?: Record<string, unknown> } | null | undefined;

export function userNeedsInviteActivation(user: AuthUser): boolean {
  return user?.user_metadata?.invite_activation === true;
}

/** Path where an authenticated user must finish password / activation setup. */
export function passwordSetupPathForUser(user: AuthUser): string {
  if (userNeedsInviteActivation(user)) return ACCOUNT_ACTIVATE_PATH;
  return PASSWORD_RESET_PATH;
}

export function isPasswordSetupExemptPath(pathname: string): boolean {
  return (
    pathname === ACCOUNT_ACTIVATE_PATH ||
    pathname.startsWith(`${ACCOUNT_ACTIVATE_PATH}/`) ||
    pathname === PASSWORD_RESET_PATH ||
    pathname.startsWith(`${PASSWORD_RESET_PATH}/`) ||
    pathname === "/login/forgot" ||
    pathname.startsWith("/login/forgot/")
  );
}
