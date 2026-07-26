"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/auth-user";

/**
 * Completes invite onboarding after the user sets a password while authenticated.
 * Marks organization membership active for the signed-in invitee only.
 */
export async function completeInviteActivationAction(): Promise<
  { success: true } | { error: string }
> {
  const { user } = await getAuthUser();
  if (!user) return { error: "You must be signed in to activate your account." };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { error: "Account activation is unavailable. Contact your administrator." };
  }

  const now = new Date().toISOString();
  const { error: membershipError } = await admin
    .from("user_organization_memberships")
    .update({ status: "active", joined_at: now })
    .eq("user_id", user.id)
    .in("status", ["invited", "active"]);

  if (membershipError) {
    return { error: membershipError.message };
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      status: "active",
      must_reset_password: false,
      invite_activation: false,
    },
  });

  if (metaError) {
    return { error: metaError.message };
  }

  return { success: true };
}
