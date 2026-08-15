/**
 * Organization resolution for public Interest Form.
 *
 * Production: host → organization only. Fail closed if unmapped.
 * Development/test: optional seed-org fallback, never in production.
 *
 * Client-supplied organization_slug is never authoritative.
 */

import { headers } from "next/headers";
import {
  extractDomainsFromSettings,
  normalizeHost,
  resolveSlugFromHostMap,
} from "@/lib/platform/organizations/domains";
import { PLATFORM_SEED_ORGANIZATION_SLUG } from "@/lib/platform/organizations/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ResolvedInterestOrganization = {
  readonly organizationId: string;
  readonly organizationSlug: string;
  readonly organizationName: string;
  /** True only when an explicit non-production fallback was used. */
  readonly usedInterimFallback: boolean;
  readonly matchedHost: string | null;
};

type OrgRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  settings: unknown;
};

/**
 * Dev/test-only seed-org fallback for /apply.
 * Production and Vercel production always fail closed.
 */
export function isInterestFormDevOrgFallbackEnabled(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if ((env.VERCEL_ENV ?? "").trim().toLowerCase() === "production") return false;
  if ((env.NODE_ENV ?? "").trim().toLowerCase() === "production") return false;
  if (env.ADMISSIONS_INTEREST_ALLOW_DEV_ORG_FALLBACK === "true") return true;
  const nodeEnv = (env.NODE_ENV ?? "").trim().toLowerCase();
  return nodeEnv === "development" || nodeEnv === "test";
}

async function loadActiveOrgBySlug(slug: string): Promise<OrgRow | null> {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("org_organizations")
    .select("id, slug, name, status, settings")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as OrgRow | null;
  if (!row || row.status !== "active") return null;
  return row;
}

/**
 * Single server-authoritative path: Host header → organization.
 * Uses ORGANIZATION_DOMAIN_MAP and org settings.domains (existing infra).
 */
export async function resolveOrganizationByRequestHost(
  host: string | null | undefined
): Promise<{ org: OrgRow; matchedHost: string } | null> {
  const matchedHost = normalizeHost(host);
  if (!matchedHost) return null;

  const mappedSlug = resolveSlugFromHostMap(matchedHost);
  if (mappedSlug) {
    const byMap = await loadActiveOrgBySlug(mappedSlug);
    if (byMap) return { org: byMap, matchedHost };
  }

  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("org_organizations")
    .select("id, slug, name, status, settings")
    .eq("status", "active");

  for (const row of data ?? []) {
    const org = row as OrgRow;
    const domains = extractDomainsFromSettings(org.settings);
    if (domains.includes(matchedHost)) {
      return { org, matchedHost };
    }
  }

  return null;
}

async function readRequestHost(
  inputHost?: string | null
): Promise<string | null> {
  if (inputHost) return inputHost;
  try {
    const h = await headers();
    return h.get("x-forwarded-host") ?? h.get("host");
  } catch {
    return null;
  }
}

/**
 * Resolve the organization for a public Interest Form request.
 *
 * Ignores client-supplied organization_id / organization_slug.
 * Production: host map / settings.domains only; otherwise null.
 * Dev/test: may fall back to platform seed org when explicitly allowed.
 */
export async function resolveInterestFormOrganization(input?: {
  host?: string | null;
}): Promise<ResolvedInterestOrganization | null> {
  const host = await readRequestHost(input?.host ?? null);
  const matched = await resolveOrganizationByRequestHost(host);

  if (matched) {
    return {
      organizationId: matched.org.id,
      organizationSlug: matched.org.slug,
      organizationName: matched.org.name,
      usedInterimFallback: false,
      matchedHost: matched.matchedHost,
    };
  }

  if (!isInterestFormDevOrgFallbackEnabled()) {
    return null;
  }

  const seed = await loadActiveOrgBySlug(PLATFORM_SEED_ORGANIZATION_SLUG);
  if (!seed) return null;

  return {
    organizationId: seed.id,
    organizationSlug: seed.slug,
    organizationName: seed.name,
    usedInterimFallback: true,
    matchedHost: normalizeHost(host),
  };
}
