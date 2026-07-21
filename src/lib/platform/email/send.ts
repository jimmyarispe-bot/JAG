import { getEmailProvider } from "@/lib/platform/email/provider";
import type {
  EmailDeliveryResult,
  EmailKind,
  SendEmailParams,
} from "@/lib/platform/email/types";

export type { EmailDeliveryResult, SendEmailParams, EmailKind };

/**
 * Primary send entry point for all transactional email.
 * Provider is selected via {@link getEmailProvider} (Resend in production).
 */
export async function sendTransactionalEmail(
  params: SendEmailParams
): Promise<EmailDeliveryResult> {
  return getEmailProvider().send({
    ...params,
    kind: params.kind ?? "transactional",
  });
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
    subject: "Reset your AcademyOS password",
    body: `${greeting}\n\nA password reset was requested for your account.\n\n<a href="${input.resetLink}">Reset password</a>\n\nIf you did not expect this, contact your administrator.`,
  });
}

export async function sendInvitationEmail(input: {
  to: string;
  inviteLink: string;
  recipientName?: string;
  organizationName?: string;
}): Promise<EmailDeliveryResult> {
  const org = input.organizationName?.trim() || "AcademyOS";
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
  const org = input.organizationName?.trim() || "AcademyOS";
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
