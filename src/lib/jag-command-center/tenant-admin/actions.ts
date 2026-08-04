"use server";

import { revalidatePath } from "next/cache";
import {
  FeatureFlagService,
  SubscriptionService,
  TenantService,
  type BillingProviderId,
  type OrganizationConfigExport,
  type OrganizationProfile,
  type OrganizationProfilePatch,
  type SubscriptionStatus,
  type TenantFeatureFlags,
  type TenantSubscription,
} from "@/lib/platform/tenant";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { assertSessionCanAccessOrganization } from "@/lib/jag-platform/data-plane";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

type ActionResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string };

async function requireActor() {
  const session = await getJagPlatformSession();
  if (!session) {
    return {
      ok: false as const,
      error: `Sign in required (${JAG_PLATFORM_LOGIN_PATH}).`,
    };
  }
  return {
    ok: true as const,
    actor: session.displayName || session.email,
    session,
  };
}

function requireOrgAccess(
  session: NonNullable<Awaited<ReturnType<typeof getJagPlatformSession>>>,
  organizationId: string
): { ok: true } | { ok: false; error: string } {
  const denied = assertSessionCanAccessOrganization(session, organizationId);
  if (denied) return { ok: false, error: denied };
  return { ok: true };
}

function revalidateAdmin(organizationId?: string) {
  revalidatePath("/jag/settings");
  revalidatePath("/jag/settings/organization");
  revalidatePath("/jag/settings/branding");
  revalidatePath("/jag/capabilities");
  if (organizationId) {
    revalidatePath(
      `/jag/settings/organization?org=${encodeURIComponent(organizationId)}`
    );
  }
}

export async function saveOrganizationProfileAction(
  organizationId: string,
  patch: OrganizationProfilePatch
): Promise<ActionResult<OrganizationProfile>> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const access = requireOrgAccess(auth.session, organizationId);
  if (!access.ok) return access;
  try {
    const data = TenantService.updateOrganization(
      organizationId,
      patch,
      auth.actor
    );
    revalidateAdmin(organizationId);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save organization.",
    };
  }
}

export async function setTenantFeatureFlagAction(
  organizationId: string,
  flagId: string,
  enabled: boolean
): Promise<ActionResult<TenantFeatureFlags>> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const access = requireOrgAccess(auth.session, organizationId);
  if (!access.ok) return access;
  try {
    const data = FeatureFlagService.setFlag(
      organizationId,
      flagId,
      enabled,
      auth.actor
    );
    revalidateAdmin(organizationId);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update feature flag.",
    };
  }
}

export async function updateTenantSubscriptionAction(
  organizationId: string,
  patch: Partial<{
    planId: string;
    status: SubscriptionStatus;
    seats: number;
    seatLimit: number;
    billingProvider: BillingProviderId;
  }>
): Promise<ActionResult<TenantSubscription>> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const access = requireOrgAccess(auth.session, organizationId);
  if (!access.ok) return access;
  try {
    const data = SubscriptionService.updateSubscription(
      organizationId,
      patch,
      auth.actor
    );
    if (!data) return { ok: false, error: "Organization not found." };
    revalidateAdmin(organizationId);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update subscription.",
    };
  }
}

export async function exportOrganizationConfigAction(
  organizationId: string
): Promise<ActionResult<OrganizationConfigExport>> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const access = requireOrgAccess(auth.session, organizationId);
  if (!access.ok) return access;
  try {
    const data = TenantService.exportConfiguration(organizationId, auth.actor);
    revalidateAdmin(organizationId);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Export failed.",
    };
  }
}

export async function exportBrandConfigAction(
  organizationId: string
): Promise<ActionResult<{ exportedAt: string; brand: unknown }>> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const access = requireOrgAccess(auth.session, organizationId);
  if (!access.ok) return access;
  try {
    const data = TenantService.exportBrand(organizationId, auth.actor);
    revalidateAdmin(organizationId);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Brand export failed.",
    };
  }
}

export async function exportCapabilityInventoryAction(
  organizationId: string
): Promise<
  ActionResult<{
    exportedAt: string;
    capabilities: ReturnType<typeof FeatureFlagService.listCapabilities>;
  }>
> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const access = requireOrgAccess(auth.session, organizationId);
  if (!access.ok) return access;
  try {
    const data = TenantService.exportCapabilityInventory(
      organizationId,
      auth.actor
    );
    revalidateAdmin(organizationId);
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Capability export failed.",
    };
  }
}
