/**
 * Sprint 213 — In-memory tenant registry.
 */

import { BrandRegistry } from "@/lib/platform/branding";
import { listProvisionedOrganizations } from "@/lib/jag-business/store";
import { createTenantRecord } from "./defaults";
import type { TenantRecord } from "./types";

const byOrganizationId = new Map<string, TenantRecord>();
const bySubdomain = new Map<string, string>();

function index(record: TenantRecord): void {
  byOrganizationId.set(record.profile.organizationId, record);
  bySubdomain.set(record.profile.subdomain.toLowerCase(), record.profile.organizationId);
}

function unindex(record: TenantRecord): void {
  byOrganizationId.delete(record.profile.organizationId);
  const key = record.profile.subdomain.toLowerCase();
  if (bySubdomain.get(key) === record.profile.organizationId) {
    bySubdomain.delete(key);
  }
}

function seedFromKnownSources(): void {
  // Brand registry demo tenants
  for (const brand of BrandRegistry.list()) {
    if (brand.organization_id === "platform") continue;
    if (byOrganizationId.has(brand.organization_id)) continue;
    index(
      createTenantRecord({
        organizationId: brand.organization_id,
        organizationName: brand.display_name || brand.organization_name,
        subdomain: brand.subdomain,
        industry: "education",
      })
    );
  }

  // Provisioned pilot / onboarding orgs
  for (const org of listProvisionedOrganizations()) {
    if (byOrganizationId.has(org.organizationId)) continue;
    const subdomain =
      org.organizationId.replace(/^org\./, "").split(".")[0] ||
      org.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    index(
      createTenantRecord({
        organizationId: org.organizationId,
        organizationName: org.organizationName,
        subdomain,
        industry: org.industry,
        timezone: org.timeZone,
        primaryEmail: org.founder.email,
      })
    );
  }
}

seedFromKnownSources();

export const TenantRegistry = {
  upsert(record: TenantRecord): TenantRecord {
    const existing = byOrganizationId.get(record.profile.organizationId);
    if (existing) unindex(existing);
    const next: TenantRecord = {
      ...record,
      profile: {
        ...record.profile,
        subdomain: record.profile.subdomain.toLowerCase(),
        updatedAt: new Date().toISOString(),
      },
    };
    index(next);
    return next;
  },

  get(organizationId: string): TenantRecord | null {
    return byOrganizationId.get(organizationId) ?? null;
  },

  getBySubdomain(subdomain: string): TenantRecord | null {
    const id = bySubdomain.get(subdomain.trim().toLowerCase());
    if (!id) return null;
    return byOrganizationId.get(id) ?? null;
  },

  list(): readonly TenantRecord[] {
    return Array.from(byOrganizationId.values());
  },

  ensure(input: {
    organizationId: string;
    organizationName: string;
    subdomain: string;
    industry?: string;
    timezone?: string;
    primaryEmail?: string;
  }): TenantRecord {
    const existing = byOrganizationId.get(input.organizationId);
    if (existing) return existing;
    const created = createTenantRecord(input);
    return this.upsert(created);
  },

  /** Refresh seeds from branding / provisioned stores (idempotent). */
  syncFromSources(): void {
    seedFromKnownSources();
  },

  resetForTests(): void {
    byOrganizationId.clear();
    bySubdomain.clear();
    seedFromKnownSources();
  },
};
