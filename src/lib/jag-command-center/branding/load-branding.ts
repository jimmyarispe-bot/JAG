/**
 * Sprint 211 — Thin loaders for JAG Command Center branding surfaces.
 * Application layer only — consumes `@/lib/platform/branding`.
 */

import {
  isAuthoritativeOrganizationLabel,
  isGenericOrganizationLabel,
  isOpaqueOrganizationLabel,
  resolveAuthoritativeOrganizationIdentity,
  resolveOrganizationDisplayName,
} from "@/lib/jag-business/organization-display";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  BrandService,
  listBrandObservations,
  type BrandObservation,
  type BrandTheme,
  type OrganizationBrand,
} from "@/lib/platform/branding";

export type JagBrandSessionModel = {
  readonly brand: OrganizationBrand;
  readonly theme: BrandTheme;
  readonly pageTitle: string;
  readonly emailFooter: string;
  readonly pdfFooter: string;
  readonly source: "host" | "organization" | "platform";
};

export type JagBrandingSettingsWorkspace = {
  readonly brand: OrganizationBrand;
  readonly theme: BrandTheme;
  readonly organizations: readonly { id: string; label: string }[];
  /** Server-side brands keyed by organization id for settings org switch. */
  readonly brandsByOrganizationId: Readonly<Record<string, OrganizationBrand>>;
  readonly observations: readonly BrandObservation[];
};

function shouldRepairBrandIdentity(
  brand: OrganizationBrand,
  organizationId: string
): boolean {
  return (
    isGenericOrganizationLabel(brand.display_name) ||
    isGenericOrganizationLabel(brand.organization_name) ||
    brand.display_name === organizationId ||
    brand.organization_name === organizationId ||
    isOpaqueOrganizationLabel(brand.display_name, organizationId) ||
    isOpaqueOrganizationLabel(brand.organization_name, organizationId)
  );
}

/**
 * Resolve brand for the signed-in session, optionally from request host.
 */
export function loadJagBrandForSession(
  session: JagPlatformSession | null,
  host?: string,
  preferredOrganizationId?: string | null
): JagBrandSessionModel {
  const primaryOrg = session
    ? resolveActiveWorkspaceOrganization(session, preferredOrganizationId)
    : null;

  if (primaryOrg) {
    const identity = resolveAuthoritativeOrganizationIdentity(primaryOrg.id);
    const displayName = resolveOrganizationDisplayName(
      primaryOrg.id,
      primaryOrg.name ?? session?.organizationDisplayName
    );
    const canPersist = isAuthoritativeOrganizationLabel(
      displayName,
      primaryOrg.id
    );
    const existing = BrandService.getBrand(primaryOrg.id);
    if (!existing) {
      if (canPersist) {
        BrandService.ensureOrganization(
          primaryOrg.id,
          displayName,
          identity.subdomain ??
            (primaryOrg.id === "org.the-academy-way" ? "academy" : undefined)
        );
      }
      // Missing identity: do not persist the temporary generic label.
    } else if (shouldRepairBrandIdentity(existing, primaryOrg.id) && canPersist) {
      BrandService.updateBrand(primaryOrg.id, {
        display_name: displayName,
        organization_name: displayName,
        ...(identity.subdomain ? { subdomain: identity.subdomain } : {}),
      });
    }
  }

  let brand: OrganizationBrand;
  let source: JagBrandSessionModel["source"];

  if (host?.trim()) {
    brand = BrandService.resolveForRequest({
      host,
      organizationId: primaryOrg?.id,
    });
    if (brand.organization_id === "platform") {
      source = "platform";
    } else if (primaryOrg && brand.organization_id === primaryOrg.id) {
      source = "organization";
    } else {
      source = "host";
    }
  } else if (primaryOrg) {
    brand = BrandService.resolveForRequest({ organizationId: primaryOrg.id });
    source =
      brand.organization_id === "platform" ? "platform" : "organization";
  } else {
    brand = BrandService.resolveForRequest({});
    source = "platform";
  }

  // Prefer authoritative org label over a generic/platform brand title in chrome.
  if (
    primaryOrg &&
    isAuthoritativeOrganizationLabel(
      resolveOrganizationDisplayName(
        primaryOrg.id,
        primaryOrg.name ?? session?.organizationDisplayName
      ),
      primaryOrg.id
    ) &&
    (brand.organization_id !== primaryOrg.id ||
      isGenericOrganizationLabel(brand.display_name) ||
      isOpaqueOrganizationLabel(brand.display_name, primaryOrg.id))
  ) {
    const label = resolveOrganizationDisplayName(
      primaryOrg.id,
      primaryOrg.name ?? session?.organizationDisplayName
    );
    brand = {
      ...brand,
      organization_id: primaryOrg.id,
      display_name: label,
      organization_name: label,
    };
    source = "organization";
  }

  const theme = BrandService.generateTheme(brand);

  return {
    brand,
    theme,
    pageTitle: BrandService.formatPageTitle(brand),
    emailFooter: BrandService.emailFooter(brand),
    pdfFooter: BrandService.pdfFooter(brand),
    source,
  };
}

/** Public login — host-first resolution (no session). */
export function loadJagBrandForHost(host?: string): JagBrandSessionModel {
  const brand = BrandService.resolveForRequest({ host });
  const theme = BrandService.generateTheme(brand);
  return {
    brand,
    theme,
    pageTitle: BrandService.formatPageTitle(brand),
    emailFooter: BrandService.emailFooter(brand),
    pdfFooter: BrandService.pdfFooter(brand),
    source: brand.organization_id === "platform" ? "platform" : "host",
  };
}

/** Settings workspace: current brand, theme preview, org list, observations. */
export function loadBrandingSettingsWorkspace(
  session: JagPlatformSession,
  host?: string
): JagBrandingSettingsWorkspace {
  const loaded = loadJagBrandForSession(session, host);
  const brandsByOrganizationId: Record<string, OrganizationBrand> = {};
  const organizations = listOrganizationsForSession(session).map((o) => {
    const label = resolveOrganizationDisplayName(o.id, o.name);
    if (isAuthoritativeOrganizationLabel(label, o.id)) {
      const ensured = BrandService.ensureOrganization(
        o.id,
        label,
        o.id === "org.the-academy-way" ? "academy" : undefined
      );
      brandsByOrganizationId[o.id] = ensured;
    } else {
      const existing = BrandService.getBrand(o.id);
      if (existing) brandsByOrganizationId[o.id] = existing;
    }
    return { id: o.id, label };
  });

  const selected =
    BrandService.getBrand(loaded.brand.organization_id) ?? loaded.brand;
  brandsByOrganizationId[selected.organization_id] = selected;

  return {
    brand: selected,
    theme: BrandService.generateTheme(selected),
    organizations,
    brandsByOrganizationId,
    observations: listBrandObservations(20),
  };
}

export { listBrandObservations };
