/**
 * Sprint 211 — Thin loaders for JAG Command Center branding surfaces.
 * Application layer only — consumes `@/lib/platform/branding`.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveSessionOrganization } from "@/lib/jag-platform/data-plane";
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

/**
 * Resolve brand for the signed-in session, optionally from request host.
 */
export function loadJagBrandForSession(
  session: JagPlatformSession | null,
  host?: string
): JagBrandSessionModel {
  const primaryOrg = session
    ? resolveSessionOrganization(session, session.organizationId)
    : null;

  if (primaryOrg) {
    BrandService.ensureOrganization(
      primaryOrg.id,
      primaryOrg.name,
      primaryOrg.id === "org.the-academy-way" ? "academy" : undefined
    );
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
    const ensured = BrandService.ensureOrganization(
      o.id,
      o.name,
      o.id === "org.the-academy-way" ? "academy" : undefined
    );
    brandsByOrganizationId[o.id] = ensured;
    return { id: o.id, label: o.name };
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
