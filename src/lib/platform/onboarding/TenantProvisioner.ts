/**
 * Sprint 212 — Apply brand + capability selections for a provisioned tenant.
 */

import {
  BrandService,
  type OrganizationBrand,
} from "@/lib/platform/branding";
import {
  ensureCapabilitiesRegistered,
  CapabilityRegistry,
} from "@/lib/platform/capabilities";
import { CapabilityLoader } from "@/lib/platform/capabilities/CapabilityLoader";
import { TenantService } from "@/lib/platform/tenant/TenantService";
import { FeatureFlagService } from "@/lib/platform/tenant/FeatureFlagService";
import { mergeCustomerEnabledCapabilityIds } from "./customer-capabilities";
import type { OnboardingSession } from "./types";
import { recordOnboardingObservation } from "./OnboardingObservability";

export type TenantProvisionResult = {
  readonly brand: OrganizationBrand;
  readonly enabledCapabilityIds: readonly string[];
  readonly capabilityLabels: readonly string[];
};

export const TenantProvisioner = {
  applyBrand(session: OnboardingSession, organizationId: string): OrganizationBrand {
    const name = session.organization.organizationName || organizationId;
    BrandService.ensureOrganization(
      organizationId,
      name,
      session.organization.subdomain || undefined
    );

    const brand = BrandService.updateBrand(organizationId, {
      organization_name: name,
      display_name: name,
      ...(session.organization.subdomain
        ? { subdomain: session.organization.subdomain }
        : {}),
      primary_color: session.brand.primaryColor,
      secondary_color: session.brand.secondaryColor,
      accent_color: session.brand.accentColor,
      heading_font: session.brand.headingFont,
      body_font: session.brand.bodyFont,
      light_logo_url:
        session.brand.lightLogoUrl || session.organization.logoUrl || "",
      dark_logo_url: session.brand.darkLogoUrl || "",
      powered_by_enabled: true,
    });

    recordOnboardingObservation({
      kind: "provisioning",
      sessionId: session.id,
      detail: `Brand applied for ${name}`,
      metadata: { organizationId },
    });

    return brand;
  },

  resolveEnabledCapabilities(
    session: OnboardingSession
  ): { ids: readonly string[]; labels: readonly string[] } {
    ensureCapabilitiesRegistered();
    const available = new Map(
      CapabilityLoader.listCapabilities().map((c) => [
        c.manifest.id,
        c.manifest.name,
      ])
    );
    const merged = mergeCustomerEnabledCapabilityIds(
      session.enabledCapabilityIds
    ).filter((id) => available.has(id));
    const labels = merged.map((id) => available.get(id) ?? id);
    return { ids: merged, labels };
  },

  /**
   * Persist onboarding capability selections onto the tenant FeatureFlag store
   * so customer navigation discovery is organization-bound.
   */
  bindOrganizationCapabilities(
    organizationId: string,
    enabledCapabilityIds: readonly string[],
    session: OnboardingSession
  ): void {
    ensureCapabilitiesRegistered();
    TenantService.ensureTenant({
      organizationId,
      organizationName: session.organization.organizationName,
      subdomain: session.organization.subdomain,
      industry: session.organization.industry,
      timezone: session.organization.timezone,
      primaryEmail: session.ownerEmail,
    });

    const enabled = new Set(enabledCapabilityIds);
    for (const registered of CapabilityRegistry.list()) {
      const id = registered.manifest.id;
      FeatureFlagService.setFlag(
        organizationId,
        id,
        enabled.has(id),
        session.ownerEmail || "onboarding"
      );
    }

    recordOnboardingObservation({
      kind: "provisioning",
      sessionId: session.id,
      detail: `Bound ${enabled.size} organization capabilities`,
      metadata: { organizationId, enabledCount: String(enabled.size) },
    });
  },

  provisionTenant(session: OnboardingSession, organizationId: string): TenantProvisionResult {
    const brand = this.applyBrand(session, organizationId);
    const caps = this.resolveEnabledCapabilities(session);
    this.bindOrganizationCapabilities(organizationId, caps.ids, session);
    return {
      brand,
      enabledCapabilityIds: caps.ids,
      capabilityLabels: caps.labels,
    };
  },
};
