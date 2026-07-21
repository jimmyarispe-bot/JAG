export type {
  EmailDeliveryResult,
  EmailKind,
  EmailProvider,
  EmailProviderId,
  SendEmailParams,
} from "@/lib/platform/email/types";

export { getEmailProvider, resetEmailProviderCache } from "@/lib/platform/email/provider";

export {
  sendTransactionalEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendSystemNotificationEmail,
} from "@/lib/platform/email/send";

export {
  DEFAULT_EMAIL_FROM,
  DEFAULT_EMAIL_FROM_NAME,
  resolveEmailFrom,
  resolveEmailFromName,
} from "@/lib/platform/email/from";
