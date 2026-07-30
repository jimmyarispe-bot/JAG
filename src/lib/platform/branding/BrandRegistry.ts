/**
 * Sprint 211 — In-memory organization brand registry.
 */

import { tenantDefaultBrand } from "./defaults";
import type { OrganizationBrand } from "./types";

const byOrganizationId = new Map<string, OrganizationBrand>();
const bySubdomain = new Map<string, OrganizationBrand>();

function indexBrand(brand: OrganizationBrand): void {
  byOrganizationId.set(brand.organization_id, brand);
  bySubdomain.set(brand.subdomain.toLowerCase(), brand);
}

function unindexBrand(brand: OrganizationBrand): void {
  byOrganizationId.delete(brand.organization_id);
  const key = brand.subdomain.toLowerCase();
  const current = bySubdomain.get(key);
  if (current?.organization_id === brand.organization_id) {
    bySubdomain.delete(key);
  }
}

function seedDemoBrands(): void {
  const at = new Date().toISOString();

  // The Academy Way — primary demo tenant (matches JAG platform org card)
  const academy: OrganizationBrand = {
    ...tenantDefaultBrand("org.the-academy-way", "The Academy Way", "academy"),
    display_name: "The Academy Way",
    primary_color: "#0F172A",
    secondary_color: "#1E293B",
    accent_color: "#14B8A6",
    success_color: "#059669",
    warning_color: "#D97706",
    danger_color: "#DC2626",
    heading_font: "Source Serif 4",
    body_font: "IBM Plex Sans",
    email_footer: "The Academy Way · Powered by The JAG™",
    pdf_footer: "The Academy Way · Powered by The JAG™",
    powered_by_enabled: true,
    created_at: at,
    updated_at: at,
  };

  // Charcoal + amber (acme.thejag.org)
  const acme: OrganizationBrand = {
    ...tenantDefaultBrand("org-acme", "Acme Industries", "acme"),
    display_name: "Acme Industries",
    primary_color: "#18181B",
    secondary_color: "#27272A",
    accent_color: "#F59E0B",
    success_color: "#16A34A",
    warning_color: "#EAB308",
    danger_color: "#E11D48",
    heading_font: "Fraunces",
    body_font: "DM Sans",
    email_footer: "Acme Industries · Powered by The JAG™",
    pdf_footer: "Acme Industries · Powered by The JAG™",
    powered_by_enabled: true,
    created_at: at,
    updated_at: at,
  };

  // signalcenters.thejag.org
  const signal: OrganizationBrand = {
    ...tenantDefaultBrand("org-signalcenters", "Signal Centers", "signalcenters"),
    display_name: "Signal Centers",
    primary_color: "#0C1B2A",
    secondary_color: "#16324A",
    accent_color: "#38BDF8",
    heading_font: "Source Serif 4",
    body_font: "IBM Plex Sans",
    email_footer: "Signal Centers · Powered by The JAG™",
    pdf_footer: "Signal Centers · Powered by The JAG™",
    powered_by_enabled: true,
    created_at: at,
    updated_at: at,
  };

  indexBrand(academy);
  indexBrand(acme);
  indexBrand(signal);
}

seedDemoBrands();

export const BrandRegistry = {
  upsert(brand: OrganizationBrand): OrganizationBrand {
    const existing = byOrganizationId.get(brand.organization_id);
    if (existing) {
      unindexBrand(existing);
    }
    const next: OrganizationBrand = {
      ...brand,
      subdomain: brand.subdomain.toLowerCase(),
      updated_at: new Date().toISOString(),
    };
    indexBrand(next);
    return next;
  },

  getByOrganizationId(organizationId: string): OrganizationBrand | null {
    return byOrganizationId.get(organizationId) ?? null;
  },

  getBySubdomain(subdomain: string): OrganizationBrand | null {
    return bySubdomain.get(subdomain.trim().toLowerCase()) ?? null;
  },

  list(): readonly OrganizationBrand[] {
    return Array.from(byOrganizationId.values());
  },

  remove(organizationId: string): boolean {
    const existing = byOrganizationId.get(organizationId);
    if (!existing) return false;
    unindexBrand(existing);
    return true;
  },

  resetForTests(): void {
    byOrganizationId.clear();
    bySubdomain.clear();
    seedDemoBrands();
  },
};
