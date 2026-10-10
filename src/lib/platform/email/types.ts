/**
 * Pluggable transactional email contract (C-6.2).
 * Call sites depend on this interface — never on a vendor SDK.
 */

export type EmailProviderId = "resend" | "none";

export type EmailKind =
  | "password_reset"
  | "invitation"
  | "welcome"
  | "verification"
  | "system_notification"
  | "transactional";

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  /** HTML or plain text; newlines become <br> when treated as plain. */
  body: string;
  /** Optional plain-text multipart fallback (auth-email / AcademyOS). */
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  /**
   * Blind copy. Added 9 October 2026 for the school leader, who had never
   * seen the letters going out over her own name.
   *
   * BLIND, AND THAT IS THE WHOLE POINT. A parent must not learn that her
   * letter was copied to anyone - cc would tell her. divert.ts strips this
   * along with the recipient, so a diverted test never reaches a real leader.
   */
  bcc?: string | string[];
  /** Optional classification for logging / templates. */
  kind?: EmailKind;
};

export type EmailDeliveryResult = {
  success: boolean;
  provider: EmailProviderId;
  messageId?: string;
  error?: string;
};

export interface EmailProvider {
  readonly id: EmailProviderId;
  send(params: SendEmailParams): Promise<EmailDeliveryResult>;
}
