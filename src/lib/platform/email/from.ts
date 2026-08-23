/**
 * Default outbound sender — the platform domain.
 *
 * This is the last-resort fallback when EMAIL_FROM is unset, so it must be a
 * JAG address: a subscriber domain here leaks one tenant's identity onto every
 * other tenant's mail. Per-subscriber senders come from the organization email
 * brand, not from this constant.
 */
export const DEFAULT_EMAIL_FROM = "noreply@thejag.org";

/** Default From display name for transactional email. */
export const DEFAULT_EMAIL_FROM_NAME = "The JAG";

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
