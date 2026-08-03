/** JAG Authentication Email Service — branded auth mail for every application/tenant. */

export type {
  AuthEmailKind,
  AuthEmailRecipient,
  OrganizationEmailBrand,
  RenderedAuthEmail,
  SendAuthEmailResult,
} from "@/lib/platform/auth-email/types";

export {
  AUTH_EMAIL_PLATFORM_NAME,
  loadEmailBrandForUserEmail,
  loadOrganizationEmailBrand,
  platformDefaultEmailBrand,
  resolveOrganizationEmailBrand,
} from "@/lib/platform/auth-email/branding";

export {
  authEmailRedirectTo,
  buildAuthEmailCallbackLink,
  buildLoginLink,
  resolveAuthAppUrl,
  resolveTrustedAuthAppUrl,
  safeAuthEmailNext,
  type AuthEmailLinkType,
} from "@/lib/platform/auth-email/links";

export {
  authEmailSubject,
  renderAccountActivatedEmail,
  renderEmailChangedEmail,
  renderInvitationEmail,
  renderPasswordResetEmail,
  renderVerifyEmail,
} from "@/lib/platform/auth-email/templates";

export {
  requestPasswordResetViaAuthEmail,
  sendAuthAccountActivatedEmail,
  sendAuthEmailChangedEmail,
  sendAuthInvitationEmail,
  sendAuthPasswordResetEmail,
  sendAuthVerifyEmail,
} from "@/lib/platform/auth-email/service";
