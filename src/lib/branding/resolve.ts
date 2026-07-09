import {
  buildFallbackBranding,
  FALLBACK_ROLE_LABELS,
  GENERIC_BRANDING_DEFAULTS,
} from "@/lib/branding/defaults";
import type { OrganizationBranding } from "@/lib/branding/types";
import type { EduRoleName } from "@/types/database";

function pickString(
  value: unknown,
  fallback: string
): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function extractRoleTitles(organizationConfig: Record<string, unknown>): Record<string, string> {
  const titles: Record<string, string> = {};
  const nested = organizationConfig.role_titles;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) {
        titles[key.toUpperCase()] = value.trim();
      }
    }
  }
  for (const [key, value] of Object.entries(organizationConfig)) {
    if (!key.startsWith("role_title_") || typeof value !== "string" || !value.trim()) continue;
    const roleKey = key.replace("role_title_", "").toUpperCase();
    titles[roleKey] = value.trim();
  }
  return titles;
}

export function resolveOrganizationBranding(input: {
  organizationId: string;
  organizationName: string;
  brandingConfig: Record<string, unknown>;
  organizationConfig: Record<string, unknown>;
}): OrganizationBranding {
  const fallback = buildFallbackBranding(input.organizationId, input.organizationName);
  const legalName = pickString(input.organizationConfig.legal_name, "");
  const configuredProductName = pickString(input.brandingConfig.product_name, "");
  const organizationDisplayName = legalName || input.organizationName;

  const productName = configuredProductName || organizationDisplayName;
  const monogram = pickString(
    input.brandingConfig.monogram,
    productName.trim().charAt(0).toUpperCase() || fallback.monogram
  );

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    productName,
    productTagline: pickString(
      input.brandingConfig.product_tagline,
      GENERIC_BRANDING_DEFAULTS.product_tagline
    ),
    editionLabel: pickString(
      input.brandingConfig.edition_label,
      GENERIC_BRANDING_DEFAULTS.edition_label
    ),
    monogram,
    logoUrl: pickString(input.brandingConfig.logo_url, ""),
    darkLogoUrl: pickString(input.brandingConfig.dark_logo_url, ""),
    faviconUrl: pickString(input.brandingConfig.favicon_url, ""),
    primaryColor: pickString(input.brandingConfig.primary_color, fallback.primaryColor),
    secondaryColor: pickString(input.brandingConfig.secondary_color, fallback.secondaryColor),
    accentColor: pickString(input.brandingConfig.accent_color, fallback.accentColor),
    founderWorkspaceLabel: pickString(
      input.brandingConfig.founder_workspace_label,
      GENERIC_BRANDING_DEFAULTS.founder_workspace_label
    ),
    intelligenceEngineLabel: pickString(
      input.brandingConfig.intelligence_engine_label,
      GENERIC_BRANDING_DEFAULTS.intelligence_engine_label
    ),
    missionControlLabel: pickString(
      input.brandingConfig.mission_control_label,
      GENERIC_BRANDING_DEFAULTS.mission_control_label
    ),
    complianceLabel: pickString(
      input.brandingConfig.compliance_label,
      GENERIC_BRANDING_DEFAULTS.compliance_label
    ),
    financialIntelligenceLabel: pickString(
      input.brandingConfig.financial_intelligence_label,
      GENERIC_BRANDING_DEFAULTS.financial_intelligence_label
    ),
    connectLabel: pickString(input.brandingConfig.connect_label, GENERIC_BRANDING_DEFAULTS.connect_label),
    dataHubLabel: pickString(input.brandingConfig.data_hub_label, GENERIC_BRANDING_DEFAULTS.data_hub_label),
    emailFromName: pickString(input.brandingConfig.email_from_name, productName),
    supportModeLabel: pickString(
      input.brandingConfig.support_mode_label,
      GENERIC_BRANDING_DEFAULTS.support_mode_label
    ),
    roleTitles: extractRoleTitles(input.organizationConfig),
  };
}

export function resolveRoleLabel(
  role: EduRoleName | null,
  branding: OrganizationBranding,
  dbDisplayName?: string | null
): string {
  if (!role) return "Team Member";
  const configured = branding.roleTitles[role];
  if (configured) return configured;
  if (dbDisplayName?.trim()) return dbDisplayName.trim();
  return FALLBACK_ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export function formatProductTitle(
  branding: OrganizationBranding,
  suffix?: string
): string {
  const base = branding.editionLabel
    ? `${branding.productName} — ${branding.editionLabel}`
    : branding.productName;
  return suffix ? `${suffix} | ${base}` : base;
}
