/**
 * Sprint 212 — Apply brand + capability selections for a provisioned tenant.
 */

import {
  BrandService,
  type OrganizationBrand,
} from "@/lib/platform/branding";
import { ensureCapabilitiesRegistered } from "@/lib/platform/capabilities";
import { CapabilityLoader } from "@/lib/platform/capabilities/CapabilityLoader";
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
    const ids = session.enabledCapabilityIds.filter((id) => available.has(id));
    const labels = ids.map((id) => available.get(id) ?? id);
    return { ids, labels };
  },

  provisionTenant(session: OnboardingSession, organizationId: string): TenantProvisionResult {
    const brand = this.applyBrand(session, organizationId);
    const caps = this.resolveEnabledCapabilities(session);
    return {
      brand,
      enabledCapabilityIds: caps.ids,
      capabilityLabels: caps.labels,
    };
  },
};
