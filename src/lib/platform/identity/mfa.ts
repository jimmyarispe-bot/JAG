/**
 * MFA settings + privileged permission policy.
 * Enforcement: `mfa-enforce.ts` via dashboard route guard (B.1).
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { MfaMethod } from "@/lib/platform/identity/types";
import {
  buildAuthzSnapshot,
  hasAnyPermission,
} from "@/lib/platform/identity/authorization-service";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface MfaSettings {
  user_id: string;
  mfa_required: boolean;
  preferred_method: MfaMethod | null;
  totp_enabled: boolean;
  sms_enabled: boolean;
  email_verification_enabled: boolean;
  passkey_enabled: boolean;
}

/** Privileged catalog permissions that imply MFA readiness policy. */
export const MFA_REQUIRED_PERMISSIONS = [
  "SYSTEM_ADMIN_ACCESS",
  "FINANCE_ACCESS",
  "HR_ACCESS",
  "AUDIT_ACCESS",
  "USER_MANAGEMENT_ACCESS",
  "JAG_ACCESS",
  "JAG_PLATFORM_ADMIN",
  "JAG_ORG_ACCESS",
] as const;

/** @deprecated Use MFA_REQUIRED_PERMISSIONS — role lists are not authorization inputs. */
export const MFA_EXECUTIVE_ROLES = ["FOUNDER", "CEO", "EXECUTIVE_DIRECTOR", "FINANCE", "HR"] as const;

export async function getMfaSettings(supabase: AuthClient, userId: string) {
  const { data } = await supabase
    .from("user_mfa_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data as MfaSettings | null;
}

/** Whether MFA policy applies to this user (settings flag or privileged permissions). */
export async function isMfaRequiredForUser(
  supabase: AuthClient,
  userId: string,
  roles: string[]
): Promise<boolean> {
  const settings = await getMfaSettings(supabase, userId);
  if (settings?.mfa_required) return true;
  return hasAnyPermission(buildAuthzSnapshot(userId, roles), MFA_REQUIRED_PERMISSIONS);
}

export async function markMfaMethodEnabled(
  supabase: AuthClient,
  userId: string,
  method: MfaMethod
) {
  const patch: Partial<MfaSettings> = { user_id: userId };
  if (method === "totp") patch.totp_enabled = true;
  if (method === "sms") patch.sms_enabled = true;
  if (method === "email") patch.email_verification_enabled = true;
  if (method === "passkey") patch.passkey_enabled = true;

  await supabase.from("user_mfa_settings").upsert({
    user_id: userId,
    preferred_method: method,
    ...patch,
    updated_at: new Date().toISOString(),
  });
}
