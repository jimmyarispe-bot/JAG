import {
  loadEmailBrandForUserEmail,
  loadOrganizationEmailBrand,
  platformDefaultEmailBrand,
} from "@/lib/platform/auth-email/branding";
import {
  authEmailRedirectTo,
  buildAuthEmailCallbackLink,
  buildLoginLink,
  resolveAuthAppUrl,
} from "@/lib/platform/auth-email/links";
import {
  renderAccountActivatedEmail,
  renderEmailChangedEmail,
  renderInvitationEmail,
  renderPasswordResetEmail,
  renderVerifyEmail,
} from "@/lib/platform/auth-email/templates";
import type {
  AuthEmailKind,
  OrganizationEmailBrand,
  SendAuthEmailResult,
} from "@/lib/platform/auth-email/types";
import { sendTransactionalEmail } from "@/lib/platform/email/send";
import type { EmailKind } from "@/lib/platform/email/types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import { getAdminAuthenticationService } from "@/lib/platform/authentication";

function mapKind(kind: AuthEmailKind): EmailKind {
  switch (kind) {
    case "invitation":
      return "invitation";
    case "password_reset":
      return "password_reset";
    case "verify_email":
      return "verification";
    default:
      return "transactional";
  }
}

async function deliver(input: {
  brand: OrganizationEmailBrand;
  to: string;
  rendered: {
    kind: AuthEmailKind;
    subject: string;
    html: string;
    text: string;
  };
}): Promise<SendAuthEmailResult> {
  const result = await sendTransactionalEmail({
    kind: mapKind(input.rendered.kind),
    to: input.to,
    subject: input.rendered.subject,
    body: input.rendered.html,
    text: input.rendered.text,
    from: input.brand.fromAddress,
    fromName: input.brand.fromName,
    replyTo: input.brand.replyTo ?? undefined,
  });
  return { ...result, kind: input.rendered.kind, brand: input.brand };
}

async function resolveBrand(input: {
  organizationId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
  recipientEmail?: string;
}): Promise<OrganizationEmailBrand> {
  if (input.organizationId) {
    return loadOrganizationEmailBrand({
      organizationId: input.organizationId,
      applicationKey: input.applicationKey,
    });
  }
  if (input.recipientEmail) {
    return loadEmailBrandForUserEmail(input.recipientEmail);
  }
  return platformDefaultEmailBrand(input.applicationKey ?? undefined);
}

/** Send a branded invitation email. Caller supplies a verifyOtp-ready action URL. */
export async function sendAuthInvitationEmail(input: {
  to: string;
  actionUrl: string;
  organizationId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
  recipientName?: string | null;
}): Promise<SendAuthEmailResult> {
  const brand = await resolveBrand(input);
  return deliver({
    brand,
    to: input.to,
    rendered: renderInvitationEmail({
      brand,
      actionUrl: input.actionUrl,
      recipientName: input.recipientName,
    }),
  });
}

/** Send a branded password-reset email. */
export async function sendAuthPasswordResetEmail(input: {
  to: string;
  actionUrl: string;
  organizationId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
  recipientName?: string | null;
}): Promise<SendAuthEmailResult> {
  const brand = await resolveBrand(input);
  return deliver({
    brand,
    to: input.to,
    rendered: renderPasswordResetEmail({
      brand,
      actionUrl: input.actionUrl,
      recipientName: input.recipientName,
    }),
  });
}

export async function sendAuthVerifyEmail(input: {
  to: string;
  actionUrl: string;
  organizationId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
  recipientName?: string | null;
}): Promise<SendAuthEmailResult> {
  const brand = await resolveBrand(input);
  return deliver({
    brand,
    to: input.to,
    rendered: renderVerifyEmail({
      brand,
      actionUrl: input.actionUrl,
      recipientName: input.recipientName,
    }),
  });
}

export async function sendAuthEmailChangedEmail(input: {
  to: string;
  organizationId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
  recipientName?: string | null;
  newEmail?: string;
  actionUrl?: string;
}): Promise<SendAuthEmailResult> {
  const brand = await resolveBrand(input);
  return deliver({
    brand,
    to: input.to,
    rendered: renderEmailChangedEmail({
      brand,
      actionUrl: input.actionUrl ?? buildLoginLink(),
      recipientName: input.recipientName,
      newEmail: input.newEmail,
    }),
  });
}

export async function sendAuthAccountActivatedEmail(input: {
  to: string;
  organizationId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
  recipientName?: string | null;
  actionUrl?: string;
}): Promise<SendAuthEmailResult> {
  const brand = await resolveBrand(input);
  return deliver({
    brand,
    to: input.to,
    rendered: renderAccountActivatedEmail({
      brand,
      actionUrl: input.actionUrl ?? buildLoginLink(),
      recipientName: input.recipientName,
    }),
  });
}

/**
 * Self-serve forgot password:
 * generate recovery token via Supabase Admin (no Supabase SMTP),
 * deliver branded email via Resend.
 *
 * Always returns success to the client to avoid account enumeration.
 */
export async function requestPasswordResetViaAuthEmail(input: {
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { ok: false, error: "Password reset is temporarily unavailable." };
  }

  const appUrl = resolveAuthAppUrl();
  const authAdmin = getAdminAuthenticationService();

  try {
    const { data: profile } = await admin
      .from("users")
      .select("id, full_name, email")
      .ilike("email", email)
      .maybeSingle();

    // Enumeration-safe: if no profile, still report success.
    if (!profile?.id) {
      return { ok: true };
    }

    const userResult = await authAdmin.getUserById(profile.id);
    if (!userResult.ok || !userResult.data?.email) {
      return { ok: true };
    }
    const authUser = userResult.data;

    if (!authUser.email) {
      return { ok: true };
    }
    const recoveryEmail = authUser.email;

    const linkResult = await authAdmin.generateRecovery(recoveryEmail, {
      redirectTo: authEmailRedirectTo(appUrl),
    });
    if (!linkResult.ok) {
      console.error("[auth-email] recovery generateLink failed", linkResult.error);
      return { ok: true };
    }

    const actionUrl = buildAuthEmailCallbackLink({
      tokenHash: linkResult.data.tokenHash,
      type: "recovery",
      appUrl,
    });

    const brand = await loadEmailBrandForUserEmail(email);
    const mail = await deliver({
      brand,
      to: recoveryEmail,
      rendered: renderPasswordResetEmail({
        brand,
        actionUrl,
        recipientName:
          profile.full_name ||
          (authUser.userMetadata.full_name as string | undefined) ||
          null,
      }),
    });

    if (!mail.success) {
      console.error("[auth-email] recovery delivery failed", mail.error);
    }
    return { ok: true };
  } catch (err) {
    console.error(
      "[auth-email] requestPasswordResetViaAuthEmail",
      err instanceof Error ? err.message : err
    );
    return { ok: true };
  }
}
