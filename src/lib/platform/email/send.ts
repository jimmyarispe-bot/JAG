import { getEmailProvider } from "@/lib/platform/email/provider";
import {
  divertEmail,
  emailDivertAddresses,
  emailIsDiverted,
  everyRecipientIsExcepted,
} from "@/lib/platform/email/divert";
import type {
  EmailDeliveryResult,
  EmailKind,
  SendEmailParams,
} from "@/lib/platform/email/types";

export type { EmailDeliveryResult, SendEmailParams, EmailKind };

/**
 * Primary send entry point for all transactional email.
 * Provider is selected via {@link getEmailProvider} (Resend in production).
 *
 * EVERY EMAIL THE PLATFORM SENDS PASSES THROUGH HERE, which is why the
 * diversion lives here and nowhere else. See divert.ts: while EMAIL_DIVERT_TO
 * is set, nothing reaches anybody except that address - admissions letters,
 * staff notices, password resets, invitations, all of it. The whole chain
 * still runs; only the envelope changes.
 */
export async function sendTransactionalEmail(
  params: SendEmailParams
): Promise<EmailDeliveryResult> {
  const withKind: SendEmailParams = {
    ...params,
    kind: params.kind ?? "transactional",
  };

  if (emailIsDiverted()) {
    const diverted = divertEmail(withKind);

    /*
     * SET BUT UNUSABLE MEANS SEND NOTHING.
     *
     * Somebody typed a diversion address and got it wrong - a missing @, a
     * stray quote. The intent is unmistakable: do not mail families. Falling
     * back to normal delivery because the protection was malformed would mail
     * every one of them, which is the worst possible reading of that typo.
     *
     * So it refuses, and says so where somebody will see it rather than
     * returning a quiet success. A refusal is recorded as a failed delivery by
     * the caller, which is visible; a silent pass-through would not be.
     */
    if (!diverted) {
      const detail =
        `EMAIL_DIVERT_TO is set but no valid address could be read from it. ` +
        `Nothing was sent.`;
      console.error("[email] refusing to send:", detail);
      return { success: false, provider: "none", error: detail };
    }

    /*
     * THE LOG MUST NOT SAY "diverted" ABOUT MAIL THAT WENT TO THE PERSON.
     *
     * EMAIL_DIVERT_EXCEPT lets a named staff address through. This line is
     * the only record that it happened, and a log claiming a letter was
     * caught when it was delivered is worse than no log: it is the thing
     * somebody would check first, answering confidently and wrongly.
     */
    const letThrough = everyRecipientIsExcepted(withKind.to);
    console.log(
      letThrough ? "[email] delivered, divert exception" : "[email] diverted",
      JSON.stringify({
        addressedTo: Array.isArray(params.to) ? params.to : [params.to],
        sentTo: letThrough
          ? (Array.isArray(params.to) ? params.to : [params.to])
          : emailDivertAddresses(),
        kind: withKind.kind,
        subject: params.subject,
      })
    );

    return getEmailProvider().send(diverted);
  }

  return getEmailProvider().send(withKind);
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetLink: string;
  recipientName?: string;
}): Promise<EmailDeliveryResult> {
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hello,";
  return sendTransactionalEmail({
    kind: "password_reset",
    to: input.to,
    subject: "Reset your password",
    body: `${greeting}\n\nA password reset was requested for your account.\n\n<a href="${input.resetLink}">Reset password</a>\n\nIf you did not expect this, contact your administrator.`,
  });
}

export async function sendInvitationEmail(input: {
  to: string;
  inviteLink: string;
  recipientName?: string;
  organizationName?: string;
}): Promise<EmailDeliveryResult> {
  const org = input.organizationName?.trim() || "The Academy Way";
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hello,";
  return sendTransactionalEmail({
    kind: "invitation",
    to: input.to,
    subject: `You're invited to ${org}`,
    body: `${greeting}\n\nYou've been invited to join ${org}.\n\n<a href="${input.inviteLink}">Accept invitation</a>\n\nIf you were not expecting this invitation, you can ignore this email.`,
  });
}

export async function sendWelcomeEmail(input: {
  to: string;
  loginLink: string;
  recipientName?: string;
  organizationName?: string;
}): Promise<EmailDeliveryResult> {
  const org = input.organizationName?.trim() || "The Academy Way";
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hello,";
  return sendTransactionalEmail({
    kind: "welcome",
    to: input.to,
    subject: `Welcome to ${org}`,
    body: `${greeting}\n\nYour account is ready.\n\n<a href="${input.loginLink}">Sign in</a>\n\nIf you need help, contact your administrator.`,
  });
}

export async function sendVerificationEmail(input: {
  to: string;
  verifyLink: string;
  recipientName?: string;
}): Promise<EmailDeliveryResult> {
  const greeting = input.recipientName ? `Hi ${input.recipientName},` : "Hello,";
  return sendTransactionalEmail({
    kind: "verification",
    to: input.to,
    subject: "Verify your email address",
    body: `${greeting}\n\nPlease verify your email address to continue.\n\n<a href="${input.verifyLink}">Verify email</a>\n\nIf you did not create an account, you can ignore this email.`,
  });
}

export async function sendSystemNotificationEmail(input: {
  to: string | string[];
  subject: string;
  body: string;
}): Promise<EmailDeliveryResult> {
  return sendTransactionalEmail({
    kind: "system_notification",
    to: input.to,
    subject: input.subject,
    body: input.body,
  });
}
