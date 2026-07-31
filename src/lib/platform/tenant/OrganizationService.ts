/**
 * Sprint 213 — Organization profile CRUD (application layer).
 */

import { BrandService } from "@/lib/platform/branding";
import { recordOrganizationAdminAudit } from "./OrganizationObservability";
import { isReservedSubdomain } from "./reserved-subdomains";
import { TenantRegistry } from "./TenantRegistry";
import type {
  OrganizationProfile,
  OrganizationStatus,
  SubdomainAvailability,
  TenantContact,
} from "./types";

export type OrganizationProfilePatch = Partial<{
  organizationName: string;
  legalName: string;
  industry: string;
  timezone: string;
  subdomain: string;
  status: OrganizationStatus;
  primaryContact: TenantContact;
  executiveContact: TenantContact;
  supportContact: TenantContact;
  customDomain: string | null;
}>;

export const OrganizationService = {
  getProfile(organizationId: string): OrganizationProfile | null {
    return TenantRegistry.get(organizationId)?.profile ?? null;
  },

  listProfiles(): readonly OrganizationProfile[] {
    return TenantRegistry.list().map((t) => t.profile);
  },

  updateProfile(
    organizationId: string,
    patch: OrganizationProfilePatch,
    actorLabel = "system"
  ): OrganizationProfile | null {
    const record = TenantRegistry.get(organizationId);
    if (!record) return null;

    if (patch.subdomain !== undefined) {
      const check = this.checkSubdomainAvailability(
        patch.subdomain,
        organizationId
      );
      if (!check.available) {
        throw new Error(check.reason ?? "Subdomain unavailable.");
      }
    }

    const profile: OrganizationProfile = {
      ...record.profile,
      ...patch,
      subdomain: (patch.subdomain ?? record.profile.subdomain).toLowerCase(),
      primaryContact: patch.primaryContact ?? record.profile.primaryContact,
      executiveContact:
        patch.executiveContact ?? record.profile.executiveContact,
      supportContact: patch.supportContact ?? record.profile.supportContact,
      updatedAt: new Date().toISOString(),
    };

    TenantRegistry.upsert({ ...record, profile });

    // Keep brand display name / subdomain aligned when renamed.
    if (patch.organizationName || patch.subdomain) {
      BrandService.ensureOrganization(
        organizationId,
        profile.organizationName,
        profile.subdomain
      );
      BrandService.updateBrand(organizationId, {
        organization_name: profile.organizationName,
        display_name: profile.organizationName,
        subdomain: profile.subdomain,
      });
      recordOrganizationAdminAudit({
        kind: "brand_change",
        organizationId,
        actorLabel,
        detail: "Brand identity synced from organization profile",
      });
    }

    recordOrganizationAdminAudit({
      kind: "organization_update",
      organizationId,
      actorLabel,
      detail: `Updated organization fields: ${Object.keys(patch).join(", ") || "(none)"}`,
    });

    return profile;
  },

  checkSubdomainAvailability(
    subdomain: string,
    currentOrganizationId?: string
  ): SubdomainAvailability {
    const normalized = subdomain.trim().toLowerCase();
    if (!normalized) {
      return {
        subdomain: normalized,
        available: false,
        reserved: false,
        reason: "Subdomain is required.",
        currentOwnerOrganizationId: null,
      };
    }
    if (!/^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])?$/.test(normalized)) {
      return {
        subdomain: normalized,
        available: false,
        reserved: false,
        reason: "Invalid subdomain format.",
        currentOwnerOrganizationId: null,
      };
    }
    if (isReservedSubdomain(normalized)) {
      return {
        subdomain: normalized,
        available: false,
        reserved: true,
        reason: "This subdomain is reserved.",
        currentOwnerOrganizationId: null,
      };
    }
    const owner = TenantRegistry.getBySubdomain(normalized);
    if (
      owner &&
      owner.profile.organizationId !== currentOrganizationId
    ) {
      return {
        subdomain: normalized,
        available: false,
        reserved: false,
        reason: "Subdomain is already in use.",
        currentOwnerOrganizationId: owner.profile.organizationId,
      };
    }
    return {
      subdomain: normalized,
      available: true,
      reserved: false,
      reason: null,
      currentOwnerOrganizationId: currentOrganizationId ?? null,
    };
  },
};
