/**
 * Server-side JAG platform session helpers (Next.js cookies).
 */

import { cookies } from "next/headers";
import {
  isAuthoritativeOrganizationLabel,
  resolveOrganizationDisplayName,
} from "@/lib/jag-business/organization-display";
import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import {
  encodeJagPlatformSession,
  JAG_PLATFORM_SESSION_COOKIE,
  jagPlatformSessionCookieOptions,
  decodeJagPlatformSession,
  type JagPlatformSession,
} from "@/lib/jag-platform/session";

export async function getJagPlatformSession(): Promise<JagPlatformSession | null> {
  const jar = await cookies();
  return decodeJagPlatformSession(
    jar.get(JAG_PLATFORM_SESSION_COOKIE)?.value
  );
}

/**
 * Rebind the signed JAG session cookie to an accessible organization.
 * Used after Generate Workspace and when the org selector changes.
 * Stamps authoritative organizationDisplayName when recoverable — never the
 * generic temporary "Organization" label.
 */
export async function rebindJagPlatformSessionOrganization(
  organizationId: string
): Promise<
  | { readonly ok: true; readonly session: JagPlatformSession }
  | { readonly ok: false; readonly error: string }
> {
  const id = organizationId.trim();
  if (!id) return { ok: false, error: "organizationId is required." };

  const current = await getJagPlatformSession();
  if (!current) return { ok: false, error: "Not authenticated." };
  if (!sessionCanAccessOrganization(current, id)) {
    return { ok: false, error: "Organization access denied." };
  }

  const resolvedName = resolveOrganizationDisplayName(
    id,
    current.organizationId === id ? current.organizationDisplayName : null
  );
  const organizationDisplayName = isAuthoritativeOrganizationLabel(
    resolvedName,
    id
  )
    ? resolvedName
    : current.organizationId === id &&
        isAuthoritativeOrganizationLabel(current.organizationDisplayName, id)
      ? current.organizationDisplayName
      : null;

  const next: JagPlatformSession = {
    ...current,
    organizationId: id,
    organizationDisplayName,
    issuedAt: new Date().toISOString(),
  };
  const token = await encodeJagPlatformSession(next);
  if (!token) {
    return { ok: false, error: "Session signing unavailable." };
  }

  const jar = await cookies();
  jar.set(
    JAG_PLATFORM_SESSION_COOKIE,
    token,
    jagPlatformSessionCookieOptions()
  );
  return { ok: true, session: next };
}
