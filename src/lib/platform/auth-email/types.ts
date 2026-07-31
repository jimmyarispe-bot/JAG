import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import type { EmailDeliveryResult } from "@/lib/platform/email/types";

/** Auth email kinds owned by the JAG Authentication Email Service. */
export type AuthEmailKind =
  | "invitation"
  | "password_reset"
  | "verify_email"
  | "email_changed"
  | "account_activated"
  | "mfa_recovery";

/**
 * Resolved sender / brand for one organization + application.
 * Never hardcode tenant names in call sites — resolve via branding.ts.
 */
export type OrganizationEmailBrand = {
  applicationKey: PlatformApplicationKey;
  applicationName: string;
  organizationId: string;
  displayName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  replyTo: string | null;
  fromName: string;
  fromAddress: string;
  supportEmail: string;
  website: string;
};

export type AuthEmailRecipient = {
  email: string;
  name?: string | null;
};

export type RenderedAuthEmail = {
  kind: AuthEmailKind;
  subject: string;
  html: string;
  text: string;
};

export type SendAuthEmailResult = EmailDeliveryResult & {
  kind: AuthEmailKind;
  brand: OrganizationEmailBrand;
};
