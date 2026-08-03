/**
 * Client/server-safe helpers for JAG password reset when MFA is enrolled.
 * Recovery sessions are typically AAL1; Supabase requires AAL2 to change password
 * when the user has verified MFA factors (nextLevel === "aal2").
 */

import { JAG_PLATFORM_RESET_PASSWORD_PATH } from "@/lib/jag-platform/auth";
import { safeInternalPath } from "@/lib/auth/auth-callback";

type MfaAalClient = {
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel: () => Promise<{
        data: {
          currentLevel: string | null;
          nextLevel: string | null;
        } | null;
        error: { message: string } | null;
      }>;
    };
  };
};

/** True when Supabase will require an MFA step-up before password/email updates. */
export async function passwordUpdateRequiresMfaStepUp(
  supabase: MfaAalClient
): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return false;
    if (data.currentLevel === "aal2") return false;
    return data.nextLevel === "aal2";
  } catch {
    return false;
  }
}

/** Return URL for MFA completion — back to JAG reset (never JAG establish/home). */
export function jagPasswordResetReturnPath(nextAfterReset?: string | null): string {
  const next = safeInternalPath(nextAfterReset, "/jag/login");
  const safeNext = next.startsWith("/jag") ? next : "/jag/login";
  return `${JAG_PLATFORM_RESET_PASSWORD_PATH}?next=${encodeURIComponent(safeNext)}`;
}

/** Existing MFA UI with return to JAG reset after AAL2. */
export function jagPasswordResetMfaRequiredPath(
  nextAfterReset?: string | null
): string {
  const resetReturn = jagPasswordResetReturnPath(nextAfterReset);
  return `/login/mfa-required?next=${encodeURIComponent(resetReturn)}`;
}

export function isAal2RequiredErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("aal2") ||
    (lower.includes("mfa") && lower.includes("password"))
  );
}
