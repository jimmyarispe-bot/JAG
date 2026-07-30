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
  type BrandResolveInput,
  type BrandTheme,
  type OrganizationBrand,
} from "./types";

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
    const existing =
      BrandRegistry.getByOrganizationId(organizationId) ??
      tenantDefaultBrand(organizationId, partial.organization_name ?? organizationId);

    const next = mergeBrand(existing, {
      ...partial,
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
    const restored =
      organizationId === "platform"
        ? platformDefaultBrand()
        : tenantDefaultBrand(
            organizationId,
            existing?.organization_name ?? organizationId,
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
    if (brand.email_footer?.trim()) return brand.email_footer;
    if (brand.powered_by_enabled) {
      return `${brand.display_name} · ${POWERED_BY_LINE}`;
    }
    return brand.display_name;
  },

  pdfFooter(brand: OrganizationBrand): string {
    if (brand.pdf_footer?.trim()) return brand.pdf_footer;
    if (brand.powered_by_enabled) {
      return `${brand.display_name} · ${POWERED_BY_LINE}`;
    }
    return brand.display_name;
  },

  formatPageTitle(brand: OrganizationBrand, section?: string): string {
    const base = `${brand.display_name} Executive Intelligence Platform`;
    if (section?.trim()) return `${section.trim()} · ${base}`;
    return base;
  },

  ensureOrganization(
    organizationId: string,
    name: string,
    subdomain?: string
  ): OrganizationBrand {
    const existing = BrandRegistry.getByOrganizationId(organizationId);
    if (existing) return existing;
    const created = tenantDefaultBrand(organizationId, name, subdomain);
    const saved = BrandRegistry.upsert(created);
    recordBrandObservation({
      kind: "brand_update",
      organizationId,
      detail: `Ensured brand for ${name} (${saved.subdomain})`,
    });
    return saved;
  },

  /** Test helper — clear asset store alongside registry reset. */
  resetForTests(): void {
    BrandRegistry.resetForTests();
    AssetService.resetForTests();
  },
};
