/**
 * B.1 — MFA enforcement for privileged sessions.
 *
 * Policy:
 * - Privileged permission holders require MFA when ENFORCE_MFA=true, or in production
 *   when the user already has an MFA factor / mfa_required flag.
 * - If factors are enrolled, session must be AAL2.
 */

import { redirect } from "next/navigation";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { IdentityContext } from "@/lib/platform/identity/context";
import {
  getMfaSettings,
  isMfaRequiredForUser,
  MFA_REQUIRED_PERMISSIONS,
} from "@/lib/platform/identity/mfa";
import { hasAnyPermission, toAuthzSnapshot } from "@/lib/platform/identity/authorization-service";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function shouldHardEnforce(): boolean {
  if (process.env.ENFORCE_MFA === "true") return true;
  if (process.env.ENFORCE_MFA === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function enforcePrivilegedMfa(
  supabase: AuthClient,
  ctx: IdentityContext
): Promise<void> {
  const snapshot = toAuthzSnapshot(ctx);
  const privileged = hasAnyPermission(snapshot, [...MFA_REQUIRED_PERMISSIONS]);
  if (!privileged) return;

  const required = await isMfaRequiredForUser(supabase, ctx.id, ctx.roles);
  const settings = await getMfaSettings(supabase, ctx.id);
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

  if (aal2) return;

  // Enrolled but not stepped up — always block privileged surfaces
  if (hasFactor || settings?.mfa_required) {
    redirect("/login/mfa-required");
  }

  // Privileged without enrollment — hard enforce when configured
  if (required && shouldHardEnforce()) {
    redirect("/login/mfa-required");
  }
}
