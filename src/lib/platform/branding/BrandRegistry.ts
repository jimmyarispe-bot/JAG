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

  /**
   * The Academy Way.
   *
   * THIS STRING IS THE FRONT DOOR.
   *
   * resolveFromHost -> extractSubdomainFromHost -> getBySubdomain reads this
   * map and nothing else, so whatever is written here is the address that
   * serves The Academy Way's sign-in page. Everything else is a mirror.
   *
   * It said "academy" from Sprint 211 until 16 September 2026, which is why
   * school leaders were sent to academy.thejag.org. Nobody chose that as a
   * public address - it was a short slug typed next to org.the-academy-way, in
   * here and again in migration 226's seed. Jimmy asked why it was not
   * theacademyway.thejag.org and there was no better answer than "a migration
   * typed something else".
   *
   * The lesson that cost the most: the database column with the same name is
   * NOT the source of truth. Changing organization_brands.subdomain alone moved
   * nothing, because this map never reads it - it only made wrong-door.ts point
   * at a host the site would not serve. brand-subdomain.test.ts now asserts the
   * two agree, so they cannot drift apart again.
   */
  const academy: OrganizationBrand = {
    ...tenantDefaultBrand("org.the-academy-way", "The Academy Way", "theacademyway"),
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

  /**
   * The old door still opens.
   *
   * academy.thejag.org is the address every school leader was given, is in
   * their bookmarks, and is what JAG's own wrong-door screen has been telling
   * locked-out people to use all week. Moving the front door without leaving
   * this open would break the one person most likely to be standing at it.
   *
   * An alias rather than a redirect, deliberately: a Vercel redirect is a
   * separate manual step that can be forgotten or mis-saved, and until it is
   * saved anyone on the old host lands on the JAG marketing site. This costs
   * one line and cannot be forgotten.
   *
   * Set directly rather than through indexBrand because the brand's own
   * subdomain is theacademyway - this is a second key pointing at the same
   * object, not a second brand. unindexBrand removes only the primary key, so
   * an alias outlives an upsert; harmless for a seeded tenant, and worth
   * knowing before adding aliases to brands that are edited at runtime.
   */
  bySubdomain.set("academy", academy);

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
