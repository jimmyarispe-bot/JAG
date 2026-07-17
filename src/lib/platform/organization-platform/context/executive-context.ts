import type { IntegrationPlatform } from "@/lib/platform/integrations";
import type { IntegrationScope } from "@/lib/platform/integrations/common/types";
import {
  actorPermissions,
  buildIntelligenceScope,
  resolveActor,
  type ActorContext,
} from "../rbac";
import type { OrganizationPlatformStore } from "../store";
import type { ExecutiveTenantContext, SessionRecord } from "../types";

/**
 * Resolve Executive Command Center tenant context from an org-platform session.
 * Does not alter ECC architecture — additive context only.
 */
export function resolveExecutiveTenantContext(
  store: OrganizationPlatformStore,
  session: SessionRecord,
  options?: {
    integrationInstanceIds?: string[];
  }
): ExecutiveTenantContext {
  if (!session.activeOrganizationId) {
    throw new Error("Session has no active organization");
  }
  const actor = resolveActor(store, session.userId, session.activeOrganizationId);
  const org = store.organizations.get(session.activeOrganizationId);
  if (!org) throw new Error("Organization not found");

  const locationId = session.activeLocationId ?? actor.membership.locationIds[0] ?? null;
  const location = locationId ? store.locations.get(locationId) : null;
  if (location && location.organizationId !== org.id) {
    throw new Error("Active location is outside organization");
  }

  const settings = store.settings.get(org.id);
  const intelligenceScope = buildIntelligenceScope({
    ...actor,
    locationId,
  });

  return {
    organizationId: org.id,
    organizationName: org.name,
    locationId,
    locationName: location?.name ?? null,
    role: actor.role,
    permissions: actorPermissions(actor),
    integrationInstanceIds: options?.integrationInstanceIds ?? [],
    intelligenceScope,
    branding: settings?.branding ?? {
      logoUrl: null,
      primaryColor: "#0f766e",
      accentColor: "#f59e0b",
      productName: "JAG",
    },
    timezone: settings?.timezone ?? "UTC",
    currency: settings?.currency ?? "USD",
  };
}

export function toIntegrationScope(scope: {
  organizationId: string;
  locationId?: string | null;
}): IntegrationScope {
  return {
    organizationId: scope.organizationId,
    schoolId: scope.locationId ?? null,
  };
}

export function requireExecAccess(actor: ActorContext): void {
  const perms = actorPermissions(actor);
  if (!perms.includes("exec.access")) {
    throw new Error("Executive Command Center access denied");
  }
}
