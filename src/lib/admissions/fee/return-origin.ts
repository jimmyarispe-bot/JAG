/**
 * Where Square sends a family back to.
 *
 * THE PROBLEM THIS SOLVES. Square needs an absolute URL. This network is
 * reachable on more than one host - the platform door
 * (theacademyway.thejag.org), whatever custom domains sit in the
 * organization's `settings.domains`, and the apex - and a parent is on exactly
 * one of them. Sending them back to a different host than the one they started
 * on drops them at a sign-in page for a session they do not have there.
 *
 * WHY THE REQUEST'S OWN HOST IS NOT SIMPLY TRUSTED. The Host header is written
 * by whoever made the request. Reflecting it into a redirect URL that a third
 * party will send a browser to is the classic open-redirect, and the third
 * party here is a payment page. So the host is accepted only when it is a host
 * we actually own: one of the organization's mapped domains, or the platform
 * domain and its subdomains. Anything else falls back to the configured public
 * origin, which is wrong-but-safe rather than attacker-chosen.
 *
 * WHY GETTING IT WRONG IS NOT A MONEY BUG. Deliberately: nothing about payment
 * is decided from the return trip. The return route re-reads the order from
 * Square by the id we stored when we created the link, and ignores the query
 * string entirely (see confirm.ts and square-order-check.ts). A poisoned host
 * can misroute a parent; it cannot mark a fee paid.
 *
 * Pure, so the allow-list can be tested without a request.
 */

import { normalizeHost } from "@/lib/platform/organizations/domains";

/** The platform's own domain. Subdomains of it are ours by construction. */
const PLATFORM_ROOT = "thejag.org";

export interface ReturnOriginInput {
  /** Host header as received, e.g. "theacademyway.thejag.org" or with a port. */
  readonly requestHost: string | null | undefined;
  /** "https" or "http", from x-forwarded-proto. Anything else is not trusted. */
  readonly requestProtocol: string | null | undefined;
  /** `org_organizations.settings.domains`, already extracted. */
  readonly organizationDomains: readonly string[];
  /** resolvePublicAppOrigin(). Used whenever the request host is not ours. */
  readonly fallbackOrigin: string;
}

function isLocal(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
}

function isPlatformHost(host: string): boolean {
  return host === PLATFORM_ROOT || host.endsWith(`.${PLATFORM_ROOT}`);
}

/**
 * The origin to build the Square redirect from, with no trailing slash.
 *
 * Returns the fallback rather than throwing. A family in the middle of paying
 * should not meet an exception because a header was odd.
 */
export function resolveFeeReturnOrigin(input: ReturnOriginInput): string {
  const fallback = input.fallbackOrigin.replace(/\/+$/, "");
  const host = normalizeHost(input.requestHost);
  if (!host) return fallback;

  const protocol = (input.requestProtocol ?? "").trim().toLowerCase().replace(/:$/, "");

  // Local development is the only place http is allowed, and the only place a
  // non-owned host is allowed - there is no organization mapping on a laptop.
  // The port is kept here and nowhere else, because a laptop serves on 3000.
  if (isLocal(host)) {
    if (protocol !== "http" && protocol !== "https") return fallback;
    const raw = (input.requestHost ?? "").trim().toLowerCase();
    if (!/^[a-z0-9.[\]:-]+$/.test(raw)) return fallback;
    return `${protocol}://${raw}`;
  }

  // Everywhere else Square is talking to a browser over TLS. An http origin
  // here is either a misconfiguration or a downgrade, and neither should
  // become the address a parent is handed after paying.
  if (protocol !== "https") return fallback;

  const owned =
    isPlatformHost(host) ||
    input.organizationDomains.some((d) => normalizeHost(d) === host);

  return owned ? `https://${host}` : fallback;
}

/** The path Square returns to. One place, so the route and the link agree. */
export function feeReturnPath(applicationId: string): string {
  return `/apply/portal/${encodeURIComponent(applicationId)}/fee/return`;
}

/**
 * The same trip, for a family who has no account.
 *
 * Keyed by the invitation token rather than the application id, because the
 * token is the only thing that identifies them - and because the page they
 * must land back on is the application they were filling in, not a portal
 * that would bounce them to a password box.
 */
export function feeReturnPathForToken(token: string): string {
  return `/apply/start/${encodeURIComponent(token)}/fee/return`;
}
