import type {
  OrganizationFeatureFlags,
  OrganizationFeatureKey,
  OrganizationSettingsJson,
} from "@/lib/platform/organizations/types";

/**
 * Canonical organization feature keys.
 * Soft-default: enabled (true) so existing AcademyOS tenants keep all modules.
 */
export const ORGANIZATION_FEATURE_CATALOG: ReadonlyArray<{
  key: OrganizationFeatureKey;
  label: string;
  description: string;
}> = [
  {
    key: "admissions",
    label: "Admissions",
    description: "Inquiry, application, and enrollment workflows.",
  },
  {
    key: "scholarships",
    label: "Scholarships",
    description: "Scholarship programs and awards.",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "Module / extension marketplace.",
  },
  {
    key: "financials",
    label: "Financials",
    description: "Tuition, billing, and financial intelligence.",
  },
  {
    key: "jag_intelligence",
    label: "JAG Intelligence",
    description: "Executive / AI intelligence surfaces.",
  },
  {
    key: "founder_workspace",
    label: "Founder Workspace",
    description: "Founder Morning Brief and founder-only workspace.",
  },
];

const DEFAULT_FEATURES: OrganizationFeatureFlags = Object.fromEntries(
  ORGANIZATION_FEATURE_CATALOG.map((f) => [f.key, true])
);

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * Resolve feature flags from org.settings.features.
 * Missing keys soft-default to enabled (AcademyOS parity).
 * Explicit `false` disables.
 */
export function resolveOrganizationFeatures(
  settings: unknown
): OrganizationFeatureFlags {
  const record = asRecord(settings) as OrganizationSettingsJson;
  const overrides = asRecord(record.features);
  const flags: OrganizationFeatureFlags = { ...DEFAULT_FEATURES };

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === "boolean") {
      flags[key] = value;
    }
  }

  return flags;
}

export function organizationHasFeature(
  features: OrganizationFeatureFlags,
  key: OrganizationFeatureKey
): boolean {
  if (key in features) return Boolean(features[key]);
  // Unknown keys soft-default enabled (open by default for forward-compat).
  return true;
}
