import { cache } from "react";
import {
  DEFAULT_APPLICATION_KEY,
  getCatalogApplication,
  PLATFORM_NAME,
} from "@/lib/platform/applications/catalog";
import {
  buildTenantApplicationSnapshot,
} from "@/lib/platform/applications/resolve";
import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import {
  resolveContextBranding,
  resolveContextEmailBrand,
} from "@/lib/platform/organizations/branding";
import {
  extractDomainsFromSettings,
  normalizeHost,
  resolveSlugFromHostMap,
} from "@/lib/platform/organizations/domains";
import { resolveOrganizationFeatures } from "@/lib/platform/organizations/features";
import {
  resolveOrganizationPolicies,
  resolveOrganizationSettings,
  resolveSupportInfo,
} from "@/lib/platform/organizations/settings";
import type {
  OrganizationContext,
  ResolveOrganizationInput,
} from "@/lib/platform/organizations/types";
import { PLATFORM_SEED_ORGANIZATION_SLUG } from "@/lib/platform/organizations/types";
import { createServiceRoleClient } from "@/lib/supabase/server";

type OrgRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  org_type: string;
  timezone: string | null;
  settings: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function loadOrgById(id: string): Promise<OrgRow | null> {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("org_organizations")
    .select("id, slug, name, status, org_type, timezone, settings")
    .eq("id", id)
    .maybeSingle();
  return (data as OrgRow | null) ?? null;
}

async function loadOrgBySlug(slug: string): Promise<OrgRow | null> {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("org_organizations")
    .select("id, slug, name, status, org_type, timezone, settings")
    .eq("slug", slug)
    .maybeSingle();
  return (data as OrgRow | null) ?? null;
}

async function loadOrgByHost(host: string): Promise<OrgRow | null> {
  const normalized = normalizeHost(host);
  if (!normalized) return null;

  const mappedSlug = resolveSlugFromHostMap(normalized);
  if (mappedSlug) {
    return loadOrgBySlug(mappedSlug);
  }

  // v1: scan active orgs for settings.domains match (small tenant N).
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("org_organizations")
    .select("id, slug, name, status, org_type, timezone, settings")
    .eq("status", "active");

  for (const row of data ?? []) {
    const domains = extractDomainsFromSettings(row.settings);
    if (domains.includes(normalized)) {
      return row as OrgRow;
    }
  }
  return null;
}

async function loadOrgForUser(userId: string): Promise<OrgRow | null> {
  const admin = createServiceRoleClient();
  const { data: membership } = await admin
    .from("user_organization_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membership?.organization_id) {
    return loadOrgById(membership.organization_id);
  }

  const { data: owned } = await admin
    .from("org_organizations")
    .select("id, slug, name, status, org_type, timezone, settings")
    .eq("owner_user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (owned as OrgRow | null) ?? null;
}

async function loadConfigSections(organizationId: string): Promise<{
  branding: Record<string, unknown>;
  organization: Record<string, unknown>;
  academic: Record<string, unknown>;
  security: Record<string, unknown>;
}> {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("config_sections")
    .select("section_key, config_data")
    .eq("organization_id", organizationId)
    .is("school_id", null)
    .in("section_key", ["branding", "organization", "academic", "security"]);

  const byKey: Record<string, Record<string, unknown>> = {};
  for (const row of data ?? []) {
    byKey[row.section_key] = asRecord(row.config_data);
  }

  return {
    branding: byKey.branding ?? {},
    organization: byKey.organization ?? {},
    academic: byKey.academic ?? {},
    security: byKey.security ?? {},
  };
}

async function loadApplicationKey(
  organizationId: string,
  preferred?: PlatformApplicationKey | null
): Promise<{ key: PlatformApplicationKey; usedSoftDefault: boolean }> {
  if (preferred) {
    return { key: preferred, usedSoftDefault: false };
  }

  const admin = createServiceRoleClient();
  // Sprint 059 tables may be absent until migration 200 is applied.
  const { data, error } = await admin
    .from("organization_applications")
    .select("status, platform_applications!inner(key)")
    .eq("organization_id", organizationId)
    .eq("status", "enabled");

  if (error || !data?.length) {
    return { key: DEFAULT_APPLICATION_KEY, usedSoftDefault: true };
  }

  const first = data[0]?.platform_applications as unknown as { key?: string } | null;
  const key = (first?.key as PlatformApplicationKey | undefined) ?? DEFAULT_APPLICATION_KEY;
  return { key, usedSoftDefault: false };
}

function buildFallbackContext(
  matchedHost: string | null,
  applicationKey?: PlatformApplicationKey | null
): OrganizationContext {
  const key = applicationKey ?? DEFAULT_APPLICATION_KEY;
  const catalog = getCatalogApplication(key);
  const branding = resolveContextBranding({
    organizationId: "platform",
    organizationName: "School Platform",
  });
  const emailBrand = resolveContextEmailBrand({
    organizationId: "platform",
    organizationName: "School Platform",
    applicationKey: key,
  });
  const features = resolveOrganizationFeatures({});
  const settings = resolveOrganizationSettings({});
  const policies = resolveOrganizationPolicies({});

  return {
    organization: {
      id: "platform",
      slug: PLATFORM_SEED_ORGANIZATION_SLUG,
      name: "School Platform",
      status: "active",
      orgType: "platform",
    },
    application: {
      key,
      name: catalog?.name ?? "Application",
      homeRoute: catalog?.homeRoute ?? "/dashboard",
      snapshot: {
        platformName: PLATFORM_NAME,
        organizationId: "platform",
        enabledApplicationKeys: [key],
        usedSoftDefault: true,
      },
    },
    branding,
    emailBrand,
    domains: {
      hosts: [],
      matchedHost,
      website: null,
    },
    features,
    email: {
      fromAddress: emailBrand.fromAddress,
      fromName: emailBrand.fromName,
    },
    support: {
      email: emailBrand.supportEmail,
      phone: null,
      replyTo: emailBrand.replyTo,
    },
    locale: settings.locale,
    timezone: settings.timezone,
    settings,
    policies,
    usedSoftDefaults: true,
  };
}

async function buildContext(
  org: OrgRow,
  matchedHost: string | null,
  applicationKey?: PlatformApplicationKey | null,
  usedSoftIdentity = false
): Promise<OrganizationContext> {
  const sections = await loadConfigSections(org.id);
  const app = await loadApplicationKey(org.id, applicationKey);
  const catalog = getCatalogApplication(app.key);

  const legalName =
    (typeof sections.organization.legal_name === "string" &&
      sections.organization.legal_name.trim()) ||
    org.name;

  const branding = resolveContextBranding({
    organizationId: org.id,
    organizationName: legalName,
    brandingConfig: sections.branding,
    organizationConfig: sections.organization,
  });

  const emailBrand = resolveContextEmailBrand({
    organizationId: org.id,
    organizationName: legalName,
    applicationKey: app.key,
    brandingConfig: sections.branding,
    organizationConfig: sections.organization,
  });

  const features = resolveOrganizationFeatures(org.settings);
  const settings = resolveOrganizationSettings({
    orgTimezone: org.timezone,
    orgSettings: org.settings,
    organizationConfig: sections.organization,
    academicConfig: sections.academic,
  });
  const policies = resolveOrganizationPolicies({
    academicConfig: sections.academic,
    securityConfig: sections.security,
  });
  const supportBase = resolveSupportInfo(sections.organization);
  const enablements = app.usedSoftDefault
    ? null
    : [{ applicationKey: app.key, status: "enabled" as const }];

  return {
    organization: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      status: org.status,
      orgType: org.org_type,
    },
    application: {
      key: app.key,
      name: catalog?.name ?? "Application",
      homeRoute: catalog?.homeRoute ?? "/dashboard",
      snapshot: buildTenantApplicationSnapshot({
        organizationId: org.id,
        enablements,
      }),
    },
    branding,
    emailBrand,
    domains: {
      hosts: extractDomainsFromSettings(org.settings),
      matchedHost,
      website:
        typeof sections.organization.website === "string"
          ? sections.organization.website
          : null,
    },
    features,
    email: {
      fromAddress: emailBrand.fromAddress,
      fromName: emailBrand.fromName,
    },
    support: {
      email: supportBase.email || emailBrand.supportEmail,
      phone: supportBase.phone,
      replyTo: emailBrand.replyTo,
    },
    locale: settings.locale,
    timezone: settings.timezone,
    settings,
    policies,
    usedSoftDefaults: usedSoftIdentity || app.usedSoftDefault,
  };
}

/**
 * Resolve organization identity from the strongest available signal.
 * Order: organizationId → host → slug → userId → platform seed slug → fallback.
 */
export async function resolveOrganizationRecord(
  input: ResolveOrganizationInput
): Promise<{ org: OrgRow | null; matchedHost: string | null; usedSeed: boolean }> {
  const matchedHost = normalizeHost(input.host);

  if (input.organizationId) {
    const org = await loadOrgById(input.organizationId);
    if (org) return { org, matchedHost, usedSeed: false };
  }

  if (matchedHost) {
    const byHost = await loadOrgByHost(matchedHost);
    if (byHost) return { org: byHost, matchedHost, usedSeed: false };
  }

  if (input.slug) {
    const org = await loadOrgBySlug(input.slug);
    if (org) return { org, matchedHost, usedSeed: false };
  }

  if (input.userId) {
    const org = await loadOrgForUser(input.userId);
    if (org) return { org, matchedHost, usedSeed: false };
  }

  const seed = await loadOrgBySlug(PLATFORM_SEED_ORGANIZATION_SLUG);
  if (seed) return { org: seed, matchedHost, usedSeed: true };

  return { org: null, matchedHost, usedSeed: true };
}

const resolveOrganizationContextCached = cache(
  async (cacheKey: string): Promise<OrganizationContext> => {
    const input = JSON.parse(cacheKey) as ResolveOrganizationInput;
    const { org, matchedHost, usedSeed } = await resolveOrganizationRecord(input);
    if (!org) {
      return buildFallbackContext(matchedHost, input.applicationKey);
    }
    return buildContext(org, matchedHost, input.applicationKey, usedSeed);
  }
);

export async function resolveOrganizationContext(
  input: ResolveOrganizationInput = {}
): Promise<OrganizationContext> {
  const cacheKey = JSON.stringify({
    organizationId: input.organizationId ?? null,
    slug: input.slug ?? null,
    host: normalizeHost(input.host),
    userId: input.userId ?? null,
    applicationKey: input.applicationKey ?? null,
  });
  return resolveOrganizationContextCached(cacheKey);
}
