import { ACADEMYOS_APPLICATION_ID } from "@/applications/academyos/manifest";
import type {
  AcademyTenantContext,
  IdentityProvider,
} from "@/applications/academyos/infrastructure/identity/types";

export function createStaticIdentityProvider(
  context: Partial<AcademyTenantContext> & {
    userId?: string | null;
    organizationId?: string | null;
  } = {}
): IdentityProvider {
  const resolved: AcademyTenantContext = {
    userId: context.userId ?? "static-user",
    organizationId: context.organizationId ?? "static-org",
    applicationId: context.applicationId ?? ACADEMYOS_APPLICATION_ID,
    roles: [...(context.roles ?? [])],
    permissions: [...(context.permissions ?? [])],
  };

  return {
    id: "static",
    async getCurrentUserId() {
      return resolved.userId;
    },
    async getCurrentOrganizationId() {
      return resolved.organizationId;
    },
    async getCurrentApplicationId() {
      return resolved.applicationId;
    },
    async getRoles() {
      return [...resolved.roles];
    },
    async getPermissions() {
      return [...resolved.permissions];
    },
    async getPermissionContext() {
      return {
        userId: resolved.userId,
        organizationId: resolved.organizationId,
        applicationId: resolved.applicationId,
        permissions: new Set(resolved.permissions),
      };
    },
    async getTenantContext() {
      return {
        ...resolved,
        roles: [...resolved.roles],
        permissions: [...resolved.permissions],
      };
    },
    async hasPermission(permission) {
      return resolved.permissions.includes(permission);
    },
  };
}
