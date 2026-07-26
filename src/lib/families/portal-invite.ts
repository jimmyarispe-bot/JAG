import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/platform/email";
import type { FamilyGuardianInput } from "@/lib/constants/guardians";
import {
  authCallbackRedirectTo,
  buildEmailAuthCallbackLink,
} from "@/lib/auth/auth-callback";

/**
 * Best-effort Parent Portal invitations for guardians with email.
 * Does not fail enrollment if Auth/email is unavailable.
 */
export async function inviteParentPortalGuardians(input: {
  organizationId: string;
  schoolId: string;
  guardians: FamilyGuardianInput[];
  organizationName?: string;
}): Promise<{ invited: number; errors: string[] }> {
  const errors: string[] = [];
  let invited = 0;

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (error) {
    return {
      invited: 0,
      errors: [error instanceof Error ? error.message : "Service role unavailable"],
    };
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(
    /\/$/,
    ""
  );

  for (const guardian of input.guardians) {
    const email = guardian.email?.trim().toLowerCase();
    if (!email) continue;

    try {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          redirectTo: appUrl ? authCallbackRedirectTo(appUrl) : undefined,
          data: {
            first_name: guardian.first_name,
            last_name: guardian.last_name,
            role: "PARENT",
            must_reset_password: true,
          },
        },
      });

      const tokenHash = linkData?.properties?.hashed_token;
      if (linkError || !tokenHash || !appUrl) {
        errors.push(linkError?.message ?? `Invite link failed for ${email}`);
        continue;
      }

      const mail = await sendInvitationEmail({
        to: email,
        inviteLink: buildEmailAuthCallbackLink({
          appUrl,
          tokenHash,
          type: "invite",
        }),
        recipientName: `${guardian.first_name} ${guardian.last_name}`.trim(),
        organizationName: input.organizationName,
      });

      if (!mail.success) {
        errors.push(mail.error ?? `Invite email failed for ${email}`);
        continue;
      }

      invited += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Invite failed for ${email}`);
    }
  }

  return { invited, errors };
}
