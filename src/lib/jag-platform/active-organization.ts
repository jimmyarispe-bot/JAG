/**
 * Resolve the active workspace organization for authenticated /jag surfaces.
 *
 * Priority:
 * 1. Explicit preferred id (?org=) when accessible
 * 2. Session-bound organization when it has a real display identity
 * 3. Completed onboarding result for this user (post-Generate Workspace handoff)
 * 4. Existing data-plane resolveSessionOrganization fallback
 */

import { getDurableOrganizationIdentity } from "@/lib/jag-business/durable-organization-identity";
import {
  isAuthoritativeOrganizationLabel,
  isOpaqueOrganizationLabel,
  resolveOrganizationDisplayName,
} from "@/lib/jag-business/organization-display";
import { getProvisionedOrganization } from "@/lib/jag-business/store";
import {
  resolveSessionOrganization,
  type SessionOrganizationRef,
} from "@/lib/jag-platform/data-plane";
import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { ExecutiveOnboardingService } from "@/lib/platform/onboarding";
import { BrandService } from "@/lib/platform/branding";
import { listOnboardingSessions } from "@/lib/platform/onboarding/session-store";
import { TenantService } from "@/lib/platform/tenant/TenantService";

function sessionFallbackName(
  session: JagPlatformSession,
  organizationId: string
): string | null {
  if (
    session.organizationId === organizationId &&
    isAuthoritativeOrganizationLabel(
      session.organizationDisplayName,
      organizationId
    )
  ) {
    return session.organizationDisplayName!.trim();
  }
  return null;
}

function namedRef(
  organizationId: string,
  fallbackName?: string | null
): SessionOrganizationRef {
  return {
    id: organizationId,
    name: resolveOrganizationDisplayName(organizationId, fallbackName),
  };
}

function hasCustomerIdentity(organizationId: string): boolean {
  const provisioned = getProvisionedOrganization(organizationId);
  if (
    provisioned?.organizationName &&
    isAuthoritativeOrganizationLabel(
      provisioned.organizationName,
      organizationId
    )
  ) {
    return true;
  }
  for (const onboarding of listOnboardingSessions()) {
    if (onboarding.organizationId !== organizationId) continue;
    if (
      isAuthoritativeOrganizationLabel(
        onboarding.organization.organizationName,
        organizationId
      )
    ) {
      return true;
    }
  }
  const durable = getDurableOrganizationIdentity(organizationId);
  if (
    durable &&
    isAuthoritativeOrganizationLabel(durable.name, organizationId)
  ) {
    return true;
  }
  const tenant = TenantService.getTenant(organizationId);
  if (
    tenant &&
    isAuthoritativeOrganizationLabel(
      tenant.profile.organizationName,
      organizationId
    )
  ) {
    return true;
  }
  const brand = BrandService.getBrand(organizationId);
  if (
    brand &&
    (isAuthoritativeOrganizationLabel(brand.display_name, organizationId) ||
      isAuthoritativeOrganizationLabel(brand.organization_name, organizationId))
  ) {
    return true;
  }
  return false;
}

/**
 * Completed onboarding org for this user, when provisioned and accessible.
 */
export function resolveOnboardingHandoffOrganization(
  session: JagPlatformSession
): SessionOrganizationRef | null {
  const onboarding = ExecutiveOnboardingService.getSessionForOwner(
    session.userId
  );
  if (!onboarding || onboarding.status !== "completed") return null;
  const organizationId = onboarding.organizationId?.trim();
  if (!organizationId) return null;
  if (!sessionCanAccessOrganization(session, organizationId)) return null;
  const name = onboarding.organization.organizationName?.trim() ?? "";
  // Authoritative onboarding identity is enough — do not require volatile caches.
  if (!isAuthoritativeOrganizationLabel(name, organizationId)) {
    if (
      !getProvisionedOrganization(organizationId) &&
      !BrandService.getBrand(organizationId)
    ) {
      return null;
    }
  }
  return namedRef(organizationId, name);
}

/**
 * Active organization for Command Center shell + loaders.
 *
 * @param options.allowSoftPick — when false (customer workspace), never
 *   soft-select the first accessible org. Platform/admin may soft-pick.
 */
export function resolveActiveWorkspaceOrganization(
  session: JagPlatformSession,
  preferredId?: string | null,
  options?: { readonly allowSoftPick?: boolean }
): SessionOrganizationRef | null {
  const preferred = preferredId?.trim() || null;
  if (preferred) {
    const resolved = resolveSessionOrganization(session, preferred);
    if (!resolved) {
      // Invalid preferred must fail closed — never soft-fallback to another tenant.
      return null;
    }
    const preferredFallback =
      sessionFallbackName(session, resolved.id) ??
      (isAuthoritativeOrganizationLabel(resolved.name, resolved.id)
        ? resolved.name
        : null);
    return {
      id: resolved.id,
      name: resolveOrganizationDisplayName(resolved.id, preferredFallback),
    };
  }

  if (session.organizationId) {
    const bound = resolveSessionOrganization(session, session.organizationId);
    const boundFallback = sessionFallbackName(session, session.organizationId);
    if (bound && (hasCustomerIdentity(bound.id) || boundFallback)) {
      const nameFallback =
        boundFallback ??
        (isAuthoritativeOrganizationLabel(bound.name, bound.id)
          ? bound.name
          : null);
      return {
        id: bound.id,
        name: resolveOrganizationDisplayName(bound.id, nameFallback),
      };
    }
    // Opaque/stale session bind: prefer completed onboarding handoff when present.
    const handoffAfterOpaque = resolveOnboardingHandoffOrganization(session);
    if (handoffAfterOpaque) return handoffAfterOpaque;
    if (bound) {
      const nameFallback =
        boundFallback ??
        (isAuthoritativeOrganizationLabel(bound.name, bound.id)
          ? bound.name
          : null);
      return {
        id: bound.id,
        name: resolveOrganizationDisplayName(bound.id, nameFallback),
      };
    }
  }

  // Unbound session after Generate Workspace — use onboarding result.
  const handoff = resolveOnboardingHandoffOrganization(session);
  if (handoff) return handoff;

  const allowSoftPick =
    options?.allowSoftPick ??
    (session.authority === "platform" || !session.authority);

  if (!allowSoftPick) return null;

  const fallback = resolveSessionOrganization(session, null);
  if (!fallback) return null;
  return {
    id: fallback.id,
    name: resolveOrganizationDisplayName(
      fallback.id,
      fallback.name ?? sessionFallbackName(session, fallback.id)
    ),
  };
}

/**
 * Whether the session cookie should be rebound to the resolved active org
 * so refresh/navigation keep the customer organization context.
 */
export function shouldRebindSessionToActiveOrganization(
  session: JagPlatformSession,
  active: SessionOrganizationRef | null
): boolean {
  if (!active) return false;
  if (session.organizationId !== active.id) {
    // Only auto-rebind when current bind is missing or has no customer identity,
    // or when completed onboarding handoff owns a different org.
    if (!session.organizationId) return true;
    if (!hasCustomerIdentity(session.organizationId)) return true;
    const handoff = resolveOnboardingHandoffOrganization(session);
    return Boolean(handoff && handoff.id === active.id);
  }

  // Same bound id — stamp authoritative display name onto the cookie when recovered.
  if (
    isAuthoritativeOrganizationLabel(active.name, active.id) &&
    isOpaqueOrganizationLabel(session.organizationDisplayName, active.id)
  ) {
    return true;
  }
  return false;
}
