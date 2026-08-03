/**
 * JAG MFA gate — mirrors AcademyOS privileged MFA policy without redirecting.
 * Callers must not issue a final JAG session when `satisfied` is false and `blocked` is true.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  getMfaSettings,
  isMfaRequiredForUser,
  MFA_REQUIRED_PERMISSIONS,
} from "@/lib/platform/identity/mfa";
import {
  buildAuthzSnapshot,
  hasAnyPermission,
} from "@/lib/platform/identity/authorization-service";

type AnySupabase = SupabaseClient | Awaited<ReturnType<typeof createAuthClient>>;

function shouldHardEnforce(): boolean {
  if (process.env.ENFORCE_MFA === "true") return true;
  if (process.env.ENFORCE_MFA === "false") return false;
  return process.env.NODE_ENV === "production";
}

export type JagMfaGateResult = {
  /** Privileged / MFA policy applies to this identity. */
  readonly applies: boolean;
  /** True when final JAG access must wait for MFA. */
  readonly blocked: boolean;
  readonly aal2: boolean;
};

export async function evaluateJagMfaGate(
  supabase: AnySupabase,
  userId: string,
  roles: readonly string[]
): Promise<JagMfaGateResult> {
  const snapshot = buildAuthzSnapshot(userId, roles);
  const privileged = hasAnyPermission(snapshot, [...MFA_REQUIRED_PERMISSIONS]);
  if (!privileged) {
    return { applies: false, blocked: false, aal2: false };
  }

  const required = await isMfaRequiredForUser(
    supabase as Awaited<ReturnType<typeof createAuthClient>>,
    userId,
    [...roles]
  );
  const settings = await getMfaSettings(
    supabase as Awaited<ReturnType<typeof createAuthClient>>,
    userId
  );
  const hasFactor =
    Boolean(settings?.totp_enabled) ||
    Boolean(settings?.sms_enabled) ||
    Boolean(settings?.passkey_enabled) ||
    Boolean(settings?.email_verification_enabled);

  let aal2 = false;
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    aal2 = data?.currentLevel === "aal2";
  } catch {
    aal2 = false;
  }

  if (aal2) {
    return { applies: true, blocked: false, aal2: true };
  }

  if (hasFactor || settings?.mfa_required) {
    return { applies: true, blocked: true, aal2: false };
  }

  if (required && shouldHardEnforce()) {
    return { applies: true, blocked: true, aal2: false };
  }

  return { applies: true, blocked: false, aal2: false };
}

export function jagMfaRequiredPath(nextPath: string): string {
  const dest =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/jag";
  return `/login/mfa-required?next=${encodeURIComponent(dest)}`;
}
