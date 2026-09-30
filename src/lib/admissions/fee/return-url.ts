/**
 * The absolute address Square sends a family back to, for this request.
 *
 * The decision itself is in return-origin.ts and is pure. This file is the
 * part that cannot be: reading the request's headers, and - only when the
 * request arrived on a host that is not the platform's own - asking whether
 * that host is one of ours before reflecting it into a redirect.
 *
 * The organization lookup is the same one the public inquiry form uses to
 * decide whether it will render at all. Reusing it means there is one answer
 * in this codebase to "is this host ours", not two that can drift.
 */

import { headers } from "next/headers";

import { resolvePublicAppOrigin } from "@/lib/platform/branding/public-origin";
import { normalizeHost, extractDomainsFromSettings } from "@/lib/platform/organizations/domains";
import { resolveOrganizationByRequestHost } from "@/lib/admissions/interest-form/org-resolve";
import {
  feeReturnPath,
  feeReturnPathForToken,
  resolveFeeReturnOrigin,
} from "@/lib/admissions/fee/return-origin";

const PLATFORM_ROOT = "thejag.org";

/**
 * The origin only. Split out on 30 September so the signed-in trip and the
 * token trip cannot answer "is this host ours" differently.
 */
async function feeReturnOrigin(): Promise<string> {
  const fallback = resolvePublicAppOrigin();

  let host: string | null = null;
  let protocol: string | null = null;
  try {
    const h = await headers();
    host = h.get("x-forwarded-host") ?? h.get("host");
    protocol = h.get("x-forwarded-proto");
  } catch {
    // No request context (a script, a test). The configured origin is correct.
    return fallback.replace(/\/+$/, "");
  }

  const normalized = normalizeHost(host);
  const isPlatform =
    normalized === PLATFORM_ROOT || Boolean(normalized?.endsWith(`.${PLATFORM_ROOT}`));

  /**
   * The lookup is skipped for the platform's own hosts, which is where every
   * signed-in parent actually is. It runs only for a custom domain, where the
   * question is real - and a domain nobody has mapped falls back rather than
   * being reflected.
   */
  let organizationDomains: string[] = [];
  if (!isPlatform && normalized) {
    try {
      const matched = await resolveOrganizationByRequestHost(normalized);
      if (matched) organizationDomains = extractDomainsFromSettings(matched.org.settings);
    } catch {
      organizationDomains = [];
    }
  }

  const origin = resolveFeeReturnOrigin({
    requestHost: host,
    requestProtocol: protocol,
    organizationDomains,
    fallbackOrigin: fallback,
  });

  return origin;
}

export async function resolveFeeReturnUrl(applicationId: string): Promise<string> {
  return `${await feeReturnOrigin()}${feeReturnPath(applicationId)}`;
}

/** The same address for a family paying from their invitation link. */
export async function resolveFeeReturnUrlForToken(token: string): Promise<string> {
  return `${await feeReturnOrigin()}${feeReturnPathForToken(token)}`;
}
