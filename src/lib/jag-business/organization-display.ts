/**
 * Human-readable organization labels for customer-facing JAG surfaces.
 * Never present a raw UUID / opaque id as the organization name.
 * Never persist the generic fallback "Organization" as a real identity.
 */

import { BrandService } from "@/lib/platform/branding";
import { getDurableOrganizationIdentity } from "@/lib/jag-business/durable-organization-identity";
import { getProvisionedOrganization } from "@/lib/jag-business/store";
import { listOnboardingSessions } from "@/lib/platform/onboarding/session-store";
import { TenantService } from "@/lib/platform/tenant/TenantService";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fabricated temporary label — not a real organization identity. */
export const GENERIC_ORGANIZATION_LABEL = "Organization" as const;

/** True when a label is the generic temporary fallback. */
export function isGenericOrganizationLabel(
  label: string | null | undefined
): boolean {
  return (label?.trim() ?? "") === GENERIC_ORGANIZATION_LABEL;
}

/** True when a label is missing, opaque, or the generic temporary fallback. */
export function isOpaqueOrganizationLabel(
  label: string | null | undefined,
  organizationId?: string | null
): boolean {
  const value = label?.trim() ?? "";
  if (!value) return true;
  if (isGenericOrganizationLabel(value)) return true;
  if (organizationId && value === organizationId) return true;
  if (UUID_RE.test(value)) return true;
  return false;
}

/** True when a label is safe to show and persist as organization identity. */
export function isAuthoritativeOrganizationLabel(
  label: string | null | undefined,
  organizationId?: string | null
): boolean {
  return !isOpaqueOrganizationLabel(label, organizationId);
}

function nameFromOnboarding(organizationId: string): string | null {
  for (const session of listOnboardingSessions()) {
    if (session.organizationId !== organizationId) continue;
    const name = session.organization.organizationName?.trim() ?? "";
    if (isAuthoritativeOrganizationLabel(name, organizationId)) {
      return name;
    }
  }
  return null;
}

function subdomainFromOnboarding(organizationId: string): string | null {
  for (const session of listOnboardingSessions()) {
    if (session.organizationId !== organizationId) continue;
    const subdomain = session.organization.subdomain?.trim() ?? "";
    if (subdomain) return subdomain;
  }
  return null;
}

function nameFromTenant(organizationId: string): string | null {
  const tenant = TenantService.getTenant(organizationId);
  const name = tenant?.profile.organizationName?.trim() ?? "";
  if (isAuthoritativeOrganizationLabel(name, organizationId)) {
    return name;
  }
  return null;
}

/**
 * Authoritative identity fields recoverable for a bound organization.
 * Does not invent records — only reads existing sources.
 */
export function resolveAuthoritativeOrganizationIdentity(
  organizationId: string
): {
  readonly id: string;
  readonly name: string | null;
  readonly subdomain: string | null;
} {
  const id = organizationId.trim();
  if (!id) {
    return { id: "", name: null, subdomain: null };
  }

  const provisioned = getProvisionedOrganization(id);
  if (
    provisioned &&
    isAuthoritativeOrganizationLabel(provisioned.organizationName, id)
  ) {
    return {
      id,
      name: provisioned.organizationName.trim(),
      subdomain: subdomainFromOnboarding(id),
    };
  }

  const fromOnboarding = nameFromOnboarding(id);
  if (fromOnboarding) {
    return {
      id,
      name: fromOnboarding,
      subdomain: subdomainFromOnboarding(id),
    };
  }

  // Durable org_organizations identity (primed via getOrganizationById).
  const durable = getDurableOrganizationIdentity(id);
  if (
    durable &&
    isAuthoritativeOrganizationLabel(durable.name, id)
  ) {
    return {
      id,
      name: durable.name,
      subdomain: durable.slug,
    };
  }

  const fromTenant = nameFromTenant(id);
  if (fromTenant) {
    return {
      id,
      name: fromTenant,
      subdomain: TenantService.getTenant(id)?.profile.subdomain ?? null,
    };
  }

  const brand = BrandService.getBrand(id);
  if (
    brand &&
    isAuthoritativeOrganizationLabel(brand.display_name, id)
  ) {
    return {
      id,
      name: brand.display_name.trim(),
      subdomain: brand.subdomain || null,
    };
  }
  if (
    brand &&
    isAuthoritativeOrganizationLabel(brand.organization_name, id)
  ) {
    return {
      id,
      name: brand.organization_name.trim(),
      subdomain: brand.subdomain || null,
    };
  }

  return { id, name: null, subdomain: subdomainFromOnboarding(id) };
}

/**
 * Resolve a customer-facing organization name from authoritative sources.
 * Order: provisioned → onboarding → durable org_organizations → tenant/brand → fallback.
 * A missing in-memory provisioned cache is not treated as "no name" when a
 * durable org_organizations identity (or onboarding/tenant) exists for the same id.
 */
export function resolveOrganizationDisplayName(
  organizationId: string,
  fallbackName?: string | null
): string {
  const id = organizationId.trim();
  if (!id) return GENERIC_ORGANIZATION_LABEL;

  const authoritative = resolveAuthoritativeOrganizationIdentity(id);
  if (authoritative.name) return authoritative.name;

  if (isAuthoritativeOrganizationLabel(fallbackName, id)) {
    return fallbackName!.trim();
  }

  return GENERIC_ORGANIZATION_LABEL;
}
