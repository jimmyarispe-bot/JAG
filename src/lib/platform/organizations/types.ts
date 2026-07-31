/**
 * Organization Platform types (Sprint 061).
 *
 * Organization = first-class tenant on JAG.
 * Applications consume OrganizationContext — not scattered hardcodes.
 */

import type { OrganizationBranding } from "@/lib/branding/types";
import type {
  PlatformApplicationKey,
  TenantApplicationSnapshot,
} from "@/lib/platform/applications/types";
import type { OrganizationEmailBrand } from "@/lib/platform/auth-email/types";

/** Platform seed tenant (Tenant #1). Only referenced inside organizations/. */
export const PLATFORM_SEED_ORGANIZATION_SLUG = "the-academy-way" as const;

export type OrganizationFeatureKey =
  | "admissions"
  | "scholarships"
  | "marketplace"
  | "financials"
  | "jag_intelligence"
  | "founder_workspace"
  | (string & {});

export type OrganizationIdentity = {
  id: string;
  slug: string;
  name: string;
  status: string;
  orgType: string;
};

export type OrganizationDomains = {
  /** Hostnames that resolve to this organization (from settings.domains). */
  hosts: string[];
  /** Host that matched this resolve (if any). */
  matchedHost: string | null;
  /** Primary public website from organization config. */
  website: string | null;
};

export type OrganizationFeatureFlags = Record<string, boolean>;

export type OrganizationSettings = {
  timezone: string;
  locale: string;
  currency: string;
  languages: string[];
  schoolYears: unknown[];
  academicCalendar: {
    terms: unknown[];
    gradeLevels: unknown[];
  };
  gradingPolicy: {
    systems: unknown[];
    attendanceMinimumPct: number | null;
  };
};

export type OrganizationSupportInfo = {
  email: string;
  phone: string | null;
  replyTo: string | null;
};

export type OrganizationPolicies = {
  attendanceMinimumPct: number | null;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number | null;
  raw: {
    academic: Record<string, unknown>;
    security: Record<string, unknown>;
  };
};

export type OrganizationApplicationInfo = {
  key: PlatformApplicationKey;
  name: string;
  homeRoute: string | null;
  snapshot: TenantApplicationSnapshot;
};

export type OrganizationContext = {
  organization: OrganizationIdentity;
  application: OrganizationApplicationInfo;
  branding: OrganizationBranding;
  emailBrand: OrganizationEmailBrand;
  domains: OrganizationDomains;
  features: OrganizationFeatureFlags;
  email: {
    fromAddress: string;
    fromName: string;
  };
  support: OrganizationSupportInfo;
  locale: string;
  timezone: string;
  settings: OrganizationSettings;
  policies: OrganizationPolicies;
  /** True when context used platform seed / soft defaults. */
  usedSoftDefaults: boolean;
};

export type ResolveOrganizationInput = {
  organizationId?: string | null;
  slug?: string | null;
  /** Request Host header (or equivalent). */
  host?: string | null;
  userId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
};

export type OrganizationSettingsJson = {
  domains?: string[];
  features?: Record<string, boolean>;
  locale?: string;
  currency?: string;
  [key: string]: unknown;
};
