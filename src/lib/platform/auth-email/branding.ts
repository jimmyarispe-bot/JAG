import {
  ACADEMYOS_APPLICATION_KEY,
  DEFAULT_APPLICATION_KEY,
  getCatalogApplication,
  PLATFORM_NAME,
} from "@/lib/platform/applications/catalog";
import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import {
  DEFAULT_EMAIL_FROM,
  DEFAULT_EMAIL_FROM_NAME,
  resolveEmailFrom,
  resolveEmailFromName,
} from "@/lib/platform/email/from";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { OrganizationEmailBrand } from "@/lib/platform/auth-email/types";

const PLATFORM_PRIMARY = "#0F172A";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
}

function pickString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

function contactEmail(orgConfig: JsonRecord): string {
  const contact = asRecord(orgConfig.contact);
  return pickString(contact.email);
}

/**
 * Resolve OrganizationEmailBrand:
 * Organization config/branding → Application catalog → Platform defaults.
 * No tenant names hardcoded in call sites.
 */
export function resolveOrganizationEmailBrand(input: {
  organizationId: string;
  organizationName: string;
  applicationKey?: PlatformApplicationKey | null;
  brandingConfig?: JsonRecord;
  organizationConfig?: JsonRecord;
  fromAddressOverride?: string | null;
}): OrganizationEmailBrand {
  const branding = asRecord(input.brandingConfig);
  const orgConfig = asRecord(input.organizationConfig);
  const appKey = (input.applicationKey || DEFAULT_APPLICATION_KEY) as PlatformApplicationKey;
  const catalogApp = getCatalogApplication(appKey);
  const applicationName = catalogApp?.name ?? "Application";

  const displayName =
    pickString(orgConfig.legal_name, input.organizationName) || DEFAULT_EMAIL_FROM_NAME;

  const configuredFromName = pickString(branding.email_from_name, displayName);
  const support =
    contactEmail(orgConfig) ||
    pickString(branding.support_email) ||
    resolveEmailFrom(input.fromAddressOverride) ||
    DEFAULT_EMAIL_FROM;

  const fromAddress = resolveEmailFrom(
    pickString(branding.email_from_address, input.fromAddressOverride) || undefined
  );
  const fromName = resolveEmailFromName(configuredFromName);

  return {
    applicationKey: appKey,
    applicationName,
    organizationId: input.organizationId,
    displayName,
    logoUrl: pickString(branding.logo_url),
    primaryColor: pickString(branding.primary_color) || PLATFORM_PRIMARY,
    secondaryColor: pickString(branding.secondary_color) || "#334155",
    replyTo: contactEmail(orgConfig) || null,
    fromName,
    fromAddress,
    supportEmail: support,
    website: pickString(orgConfig.website),
  };
}

/** Platform-level fallback when no organization can be resolved. */
export function platformDefaultEmailBrand(
  applicationKey: PlatformApplicationKey = ACADEMYOS_APPLICATION_KEY
): OrganizationEmailBrand {
  return resolveOrganizationEmailBrand({
    organizationId: "platform",
    organizationName: DEFAULT_EMAIL_FROM_NAME,
    applicationKey,
    brandingConfig: {
      email_from_name: DEFAULT_EMAIL_FROM_NAME,
      primary_color: PLATFORM_PRIMARY,
    },
    organizationConfig: {
      legal_name: DEFAULT_EMAIL_FROM_NAME,
      contact: { email: DEFAULT_EMAIL_FROM },
    },
  });
}

/**
 * Load brand for an organization using the service role (auth emails are often
 * sent without an end-user session — e.g. forgot password).
 */
export async function loadOrganizationEmailBrand(input: {
  organizationId: string;
  applicationKey?: PlatformApplicationKey | null;
}): Promise<OrganizationEmailBrand> {
  const admin = createServiceRoleClient();

  const [{ data: org }, { data: brandingRow }, { data: orgRow }] = await Promise.all([
    admin
      .from("org_organizations")
      .select("id, name, slug")
      .eq("id", input.organizationId)
      .maybeSingle(),
    admin
      .from("config_sections")
      .select("config_data")
      .eq("organization_id", input.organizationId)
      .eq("section_key", "branding")
      .is("school_id", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("config_sections")
      .select("config_data")
      .eq("organization_id", input.organizationId)
      .eq("section_key", "organization")
      .is("school_id", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!org) {
    return platformDefaultEmailBrand(input.applicationKey ?? DEFAULT_APPLICATION_KEY);
  }

  // Sprint 059 tables may be absent until migration 200 is applied.
  const { data: enablement, error: enablementError } = await admin
    .from("organization_applications")
    .select("status, platform_applications!inner(key)")
    .eq("organization_id", input.organizationId)
    .eq("status", "enabled")
    .limit(1)
    .maybeSingle();
  const enabledKey = enablementError
    ? undefined
    : ((enablement?.platform_applications as unknown as { key?: string } | null)
        ?.key as PlatformApplicationKey | undefined);

  return resolveOrganizationEmailBrand({
    organizationId: org.id,
    organizationName: org.name,
    applicationKey: input.applicationKey ?? enabledKey ?? DEFAULT_APPLICATION_KEY,
    brandingConfig: asRecord(brandingRow?.config_data),
    organizationConfig: asRecord(orgRow?.config_data),
  });
}

/**
 * Resolve brand for a recipient email via public.users + org membership.
 * Falls back to platform defaults when the user/org cannot be resolved
 * (avoids leaking account existence in forgot-password UX).
 */
export async function loadEmailBrandForUserEmail(
  email: string
): Promise<OrganizationEmailBrand> {
  const admin = createServiceRoleClient();
  const normalized = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from("users")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (profile?.id) {
    const { data: membership } = await admin
      .from("user_organization_memberships")
      .select("organization_id")
      .eq("user_id", profile.id)
      .in("status", ["invited", "active"])
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membership?.organization_id) {
      return loadOrganizationEmailBrand({
        organizationId: membership.organization_id,
      });
    }

    const { getAdminAuthenticationService } = await import(
      "@/lib/platform/authentication"
    );
    const userResult = await getAdminAuthenticationService().getUserById(profile.id);
    const metaOrg = userResult.ok ? userResult.data?.userMetadata?.organization_id : null;
    if (typeof metaOrg === "string" && metaOrg) {
      return loadOrganizationEmailBrand({ organizationId: metaOrg });
    }
  }

  return platformDefaultEmailBrand();
}

/** @internal test helper — platform name constant for docs/assertions */
export const AUTH_EMAIL_PLATFORM_NAME = PLATFORM_NAME;
