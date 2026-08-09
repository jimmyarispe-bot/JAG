/**
 * Sprint 211 — Branding façade (application layer).
 */

import { AssetService } from "./AssetService";
import { BrandRegistry } from "./BrandRegistry";
import { BrandResolver } from "./BrandResolver";
import { recordBrandObservation } from "./BrandObservability";
import { platformDefaultBrand, tenantDefaultBrand } from "./defaults";
import { buildTheme, generateTheme } from "./ThemeEngine";
import {
  POWERED_BY_LINE,
  THE_JAG_MARK,
  type BrandResolveInput,
  type BrandTheme,
  type OrganizationBrand,
} from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GENERIC_ORGANIZATION_LABEL = "Organization" as const;

function isAuthoritativeBrandLabel(
  label: string | null | undefined,
  organizationId: string
): boolean {
  const value = label?.trim() ?? "";
  if (!value) return false;
  if (value === GENERIC_ORGANIZATION_LABEL) return false;
  if (value === organizationId) return false;
  if (UUID_RE.test(value)) return false;
  return true;
}

function mergeBrand(
  base: OrganizationBrand,
  partial: Partial<OrganizationBrand>
): OrganizationBrand {
  return {
    ...base,
    ...partial,
    organization_id: base.organization_id,
    created_at: base.created_at,
    updated_at: new Date().toISOString(),
  };
}

function sanitizeNameField(
  organizationId: string,
  value: string | undefined,
  fallback: string
): string {
  if (value === undefined) return fallback;
  const trimmed = value.trim();
  if (isAuthoritativeBrandLabel(trimmed, organizationId)) {
    return trimmed;
  }
  // Refuse UUID / opaque / generic overwrite of an already-valid identity.
  if (isAuthoritativeBrandLabel(fallback, organizationId)) {
    return fallback;
  }
  return GENERIC_ORGANIZATION_LABEL;
}

function visibleBrandLabel(brand: OrganizationBrand): string {
  if (brand.organization_id === "platform") {
    return isAuthoritativeBrandLabel(brand.display_name, brand.organization_id)
      ? brand.display_name.trim()
      : THE_JAG_MARK;
  }
  if (isAuthoritativeBrandLabel(brand.display_name, brand.organization_id)) {
    return brand.display_name.trim();
  }
  if (
    isAuthoritativeBrandLabel(brand.organization_name, brand.organization_id)
  ) {
    return brand.organization_name.trim();
  }
  return GENERIC_ORGANIZATION_LABEL;
}

export const BrandService = {
  getBrand(organizationId: string): OrganizationBrand | null {
    return BrandRegistry.getByOrganizationId(organizationId);
  },

  resolveForRequest(input: BrandResolveInput): OrganizationBrand {
    // Host wins for multi-tenant subdomain routing; org id is fallback.
    if (input.host?.trim()) {
      const fromHost = BrandResolver.resolveFromHost(input.host);
      if (fromHost.organization_id !== "platform") return fromHost;
      // Host did not map to a tenant — try explicit organization id next.
    }
    if (input.organizationId) {
      const byOrg = BrandRegistry.getByOrganizationId(input.organizationId);
      if (byOrg) return byOrg;
    }
    if (input.host?.trim()) {
      return BrandResolver.resolveFromHost(input.host);
    }
    return BrandResolver.resolveDefault();
  },

  updateBrand(
    organizationId: string,
    partial: Partial<OrganizationBrand>
  ): OrganizationBrand {
    const existing = BrandRegistry.getByOrganizationId(organizationId);
    const seedName = isAuthoritativeBrandLabel(
      partial.organization_name,
      organizationId
    )
      ? partial.organization_name!.trim()
      : isAuthoritativeBrandLabel(partial.display_name, organizationId)
        ? partial.display_name!.trim()
        : GENERIC_ORGANIZATION_LABEL;

    const base =
      existing ?? tenantDefaultBrand(organizationId, seedName);

    const nextNameSource = {
      organization_name: sanitizeNameField(
        organizationId,
        partial.organization_name,
        base.organization_name
      ),
      display_name: sanitizeNameField(
        organizationId,
        partial.display_name,
        base.display_name
      ),
    };

    const next = mergeBrand(base, {
      ...partial,
      ...nextNameSource,
      organization_id: organizationId,
    });
    const saved = BrandRegistry.upsert(next);
    recordBrandObservation({
      kind: "brand_update",
      organizationId,
      detail: `Updated brand fields: ${Object.keys(partial).join(", ") || "(none)"}`,
    });
    return saved;
  },

  restoreDefaults(organizationId: string): OrganizationBrand {
    const existing = BrandRegistry.getByOrganizationId(organizationId);
    const restoredName =
      existing &&
      isAuthoritativeBrandLabel(existing.organization_name, organizationId)
        ? existing.organization_name
        : existing &&
            isAuthoritativeBrandLabel(existing.display_name, organizationId)
          ? existing.display_name
          : GENERIC_ORGANIZATION_LABEL;

    const restored =
      organizationId === "platform"
        ? platformDefaultBrand()
        : tenantDefaultBrand(
            organizationId,
            restoredName,
            existing?.subdomain
          );
    const saved = BrandRegistry.upsert(restored);
    recordBrandObservation({
      kind: "brand_update",
      organizationId,
      detail: "Restored brand defaults",
    });
    return saved;
  },

  previewTheme(
    partial: Partial<OrganizationBrand>,
    options?: { readonly record?: boolean }
  ): BrandTheme {
    const base =
      (partial.organization_id &&
        BrandRegistry.getByOrganizationId(partial.organization_id)) ||
      platformDefaultBrand();
    const overlay = mergeBrand(base, partial);
    const theme = buildTheme(overlay);
    if (options?.record) {
      recordBrandObservation({
        kind: "preview_generation",
        organizationId: overlay.organization_id,
        detail: "Preview theme generated without persist",
      });
    }
    return theme;
  },

  generateTheme(brand: OrganizationBrand): BrandTheme {
    return generateTheme(brand);
  },

  emailFooter(brand: OrganizationBrand): string {
    const label = visibleBrandLabel(brand);
    if (brand.email_footer?.trim()) return brand.email_footer;
    if (brand.powered_by_enabled) {
      return `${label} · ${POWERED_BY_LINE}`;
    }
    return label;
  },

  pdfFooter(brand: OrganizationBrand): string {
    const label = visibleBrandLabel(brand);
    if (brand.pdf_footer?.trim()) return brand.pdf_footer;
    if (brand.powered_by_enabled) {
      return `${label} · ${POWERED_BY_LINE}`;
    }
    return label;
  },

  formatPageTitle(brand: OrganizationBrand, section?: string): string {
    const label = visibleBrandLabel(brand);
    const base =
      brand.organization_id === "platform"
        ? THE_JAG_MARK
        : `${label} · ${THE_JAG_MARK}`;
    if (section?.trim()) return `${section.trim()} · ${base}`;
    return base;
  },

  ensureOrganization(
    organizationId: string,
    name: string,
    subdomain?: string
  ): OrganizationBrand {
    const existing = BrandRegistry.getByOrganizationId(organizationId);
    if (existing) {
      // Never overwrite a valid durable identity with UUID / "Organization".
      if (
        isAuthoritativeBrandLabel(existing.display_name, organizationId) ||
        isAuthoritativeBrandLabel(existing.organization_name, organizationId)
      ) {
        return existing;
      }
      if (isAuthoritativeBrandLabel(name, organizationId)) {
        return this.updateBrand(organizationId, {
          display_name: name.trim(),
          organization_name: name.trim(),
          ...(subdomain?.trim() ? { subdomain: subdomain.trim() } : {}),
        });
      }
      return existing;
    }
    const trimmed = name?.trim() ?? "";
    // Never invent / freeze a temporary generic (or opaque-id) label as brand identity.
    if (!isAuthoritativeBrandLabel(trimmed, organizationId)) {
      return tenantDefaultBrand(
        organizationId,
        GENERIC_ORGANIZATION_LABEL,
        subdomain
      );
    }
    const created = tenantDefaultBrand(organizationId, trimmed, subdomain);
    const saved = BrandRegistry.upsert(created);
    recordBrandObservation({
      kind: "brand_update",
      organizationId,
      detail: `Ensured brand for ${trimmed} (${saved.subdomain})`,
    });
    return saved;
  },

  /** Test helper — clear asset store alongside registry reset. */
  resetForTests(): void {
    BrandRegistry.resetForTests();
    AssetService.resetForTests();
  },
};
