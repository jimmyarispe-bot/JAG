/** Default outbound sender — Academy Way organization domain (not the product name). */
export const DEFAULT_EMAIL_FROM = "noreply@theacademyway.org";

/** Default From display name for transactional email. */
export const DEFAULT_EMAIL_FROM_NAME = "The Academy Way";

/**
 * Resolve the From address for outbound email.
 * Prefer explicit param → EMAIL_FROM → RESEND_FROM_EMAIL (legacy) → default.
 */
export function resolveEmailFrom(explicit?: string | null): string {
  return (
    explicit?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    DEFAULT_EMAIL_FROM
  );
}

/**
 * Resolve the From display name.
 * Prefer explicit param → RESEND_FROM_NAME → default organization name.
 */
export function resolveEmailFromName(explicit?: string | null): string {
  return (
    explicit?.trim() ||
    process.env.RESEND_FROM_NAME?.trim() ||
    DEFAULT_EMAIL_FROM_NAME
  );
}
