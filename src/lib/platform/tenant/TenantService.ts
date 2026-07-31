/**
 * Sprint 213 — Tenant administration façade.
 */

import { BrandService } from "@/lib/platform/branding";
import { FeatureFlagService } from "./FeatureFlagService";
import {
  listOrganizationAdminAudit,
  listOrganizationObservations,
  recordOrganizationAdminAudit,
} from "./OrganizationObservability";
import { OrganizationService } from "./OrganizationService";
import { OrganizationSettingsService } from "./OrganizationSettingsService";
import { SubscriptionService } from "./SubscriptionService";
import { TenantRegistry } from "./TenantRegistry";
import { UsageService } from "./UsageService";
import { RESERVED_SUBDOMAINS } from "./reserved-subdomains";
import type {
  OrganizationConfigExport,
  OrganizationProfile,
  TenantRecord,
} from "./types";
import type { OrganizationProfilePatch } from "./OrganizationService";

export const TenantService = {
  ensureTenant(input: {
    organizationId: string;
    organizationName: string;
    subdomain: string;
    industry?: string;
    timezone?: string;
    primaryEmail?: string;
  }): TenantRecord {
    TenantRegistry.syncFromSources();
    const record = TenantRegistry.ensure(input);
    BrandService.ensureOrganization(
      input.organizationId,
      input.organizationName,
      input.subdomain
    );
    UsageService.seedDemoUsage(input.organizationId);
    return TenantRegistry.get(input.organizationId) ?? record;
  },

  getTenant(organizationId: string): TenantRecord | null {
    TenantRegistry.syncFromSources();
    return TenantRegistry.get(organizationId);
  },

  listTenants(): readonly TenantRecord[] {
    TenantRegistry.syncFromSources();
    return TenantRegistry.list();
  },

  updateOrganization(
    organizationId: string,
    patch: OrganizationProfilePatch,
    actorLabel = "system"
  ): OrganizationProfile {
    return OrganizationSettingsService.saveSettings(
      organizationId,
      patch,
      actorLabel
    );
  },

  setFeatureFlag(
    organizationId: string,
    flagId: string,
    enabled: boolean,
    actorLabel = "system"
  ) {
    return FeatureFlagService.setFlag(
      organizationId,
      flagId,
      enabled,
      actorLabel
    );
  },

  exportConfiguration(
    organizationId: string,
    actorLabel = "system"
  ): OrganizationConfigExport {
    const record = TenantRegistry.get(organizationId);
    if (!record) {
      throw new Error(`Organization ${organizationId} not found.`);
    }
    const brand = BrandService.getBrand(organizationId);
    const capabilities = FeatureFlagService.listCapabilities(organizationId);
    const payload: OrganizationConfigExport = {
      exportedAt: new Date().toISOString(),
      profile: record.profile,
      subscription: record.subscription,
      featureFlags: FeatureFlagService.getFlags(organizationId),
      brand: brand ?? null,
      capabilities,
    };
    recordOrganizationAdminAudit({
      kind: "export",
      organizationId,
      actorLabel,
      detail: "Exported organization configuration, brand, and capabilities",
    });
    return payload;
  },

  exportBrand(organizationId: string, actorLabel = "system") {
    const brand = BrandService.getBrand(organizationId);
    recordOrganizationAdminAudit({
      kind: "export",
      organizationId,
      actorLabel,
      detail: "Exported brand configuration",
    });
    return {
      exportedAt: new Date().toISOString(),
      brand,
    };
  },

  exportCapabilityInventory(organizationId: string, actorLabel = "system") {
    const capabilities = FeatureFlagService.listCapabilities(organizationId);
    recordOrganizationAdminAudit({
      kind: "export",
      organizationId,
      actorLabel,
      detail: "Exported capability inventory",
    });
    return {
      exportedAt: new Date().toISOString(),
      capabilities,
    };
  },

  subdomainInfo(organizationId: string) {
    const profile = OrganizationService.getProfile(organizationId);
    const subdomain = profile?.subdomain ?? "";
    const availability = OrganizationService.checkSubdomainAvailability(
      subdomain,
      organizationId
    );
    return {
      current: subdomain,
      fqdn: subdomain ? `${subdomain}.thejag.org` : null,
      availability,
      reservedNames: RESERVED_SUBDOMAINS,
      customDomain: profile?.customDomain ?? null,
      customDomainPlaceholder: "custom domains coming soon",
    };
  },

  auditLog(organizationId: string, limit = 40) {
    return listOrganizationAdminAudit(limit, organizationId);
  },

  observations(organizationId: string, limit = 40) {
    return listOrganizationObservations(limit, organizationId);
  },

  resetForTests(): void {
    TenantRegistry.resetForTests();
  },
};

export {
  OrganizationService,
  OrganizationSettingsService,
  SubscriptionService,
  FeatureFlagService,
  UsageService,
};
