/**
 * Sprint 211 — Shared brand chrome (logo + powered-by line).
 */

import {
  isOpaqueOrganizationLabel,
  resolveOrganizationDisplayName,
} from "@/lib/jag-business/organization-display";
import {
  POWERED_BY_LINE,
  THE_JAG_MARK,
  type OrganizationBrand,
} from "@/lib/platform/branding";

export function JagBrandPoweredBy({
  brand,
  className = "text-[11px] text-[var(--jag-muted)]",
}: {
  readonly brand: Pick<OrganizationBrand, "powered_by_enabled">;
  readonly className?: string;
}) {
  if (!brand.powered_by_enabled) return null;
  return <p className={className}>{POWERED_BY_LINE}</p>;
}

function visibleBrandMarkLabel(
  brand: Pick<OrganizationBrand, "display_name" | "organization_id">
): string {
  if (brand.organization_id === "platform") {
    return isOpaqueOrganizationLabel(
      brand.display_name,
      brand.organization_id
    )
      ? THE_JAG_MARK
      : brand.display_name.trim() || THE_JAG_MARK;
  }
  return resolveOrganizationDisplayName(
    brand.organization_id,
    brand.display_name
  );
}

export function JagBrandLogoMark({
  brand,
  dark = true,
  className = "h-8 max-w-[10rem] object-contain",
}: {
  readonly brand: Pick<
    OrganizationBrand,
    "display_name" | "organization_id" | "light_logo_url" | "dark_logo_url"
  >;
  readonly dark?: boolean;
  readonly className?: string;
}) {
  const src = dark
    ? brand.dark_logo_url || brand.light_logo_url
    : brand.light_logo_url || brand.dark_logo_url;

  const label = visibleBrandMarkLabel(brand);

  if (!src) {
    return (
      <span className="font-[family-name:var(--font-jag-display)] text-sm font-semibold tracking-tight text-[var(--jag-text)]">
        {label}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- tenant CDN / data URLs
    <img src={src} alt={label} className={className} />
  );
}
