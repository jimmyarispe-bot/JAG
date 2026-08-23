import { buildFallbackBranding } from "@/lib/branding/defaults";
import type { OrganizationBranding } from "@/lib/branding/types";
import { BrandService } from "@/lib/platform/branding";
import type { OrganizationBrand } from "@/lib/platform/branding/types";

/** Tenant brand registry record -> AcademyOS branding model. */
export function brandingFromTenantBrand(
  brand: OrganizationBrand
): OrganizationBranding {
  const name =
    brand.display_name?.trim() || brand.organization_name?.trim() || "";
  const base = buildFallbackBranding(brand.organization_id, name);

  return {
    ...base,
    productName: name,
    logoUrl: brand.light_logo_url || "",
    darkLogoUrl: brand.dark_logo_url || "",
    faviconUrl: brand.favicon_url || "",
    primaryColor: brand.primary_color || base.primaryColor,
    secondaryColor: brand.secondary_color || base.secondaryColor,
    accentColor: brand.accent_color || base.accentColor,
    emailFromName: name,
  };
}

/**
 * Branding for a subscriber subdomain (e.g. `academy.thejag.org`).
 *
 * Returns null on the JAG apex and on any host that does not map to a tenant,
 * so callers keep their own fallback rather than showing another org's brand.
 */
export function brandingForTenantHost(
  host: string | null | undefined
): OrganizationBranding | null {
  if (!host?.trim()) return null;
  const brand = BrandService.resolveForRequest({ host });
  if (!brand || brand.organization_id === "platform") return null;
  return brandingFromTenantBrand(brand);
}
