import { ACADEMYOS_APPLICATION_ID } from "@/applications/academyos/manifest";
import type {
  AcademyTenantContext,
  IdentityProvider,
} from "@/applications/academyos/infrastructure/identity/types";

/**
 * JAG-backed identity bridge.
 * Resolves the current auth user via platform supabase auth helpers when available.
 */
export function createJagIdentityProvider(input?: {
  organizationId?: string | null;
  roles?: string[];
  permissions?: string[];
  applicationId?: string;
}): IdentityProvider {
  const applicationId = input?.applicationId ?? ACADEMYOS_APPLICATION_ID;
  const roles = [...(input?.roles ?? [])];
  const permissions = [...(input?.permissions ?? [])];

  async function currentUserId(): Promise<string | null> {
    try {
      const { createAuthClient } = await import("@/lib/supabase/server-auth");
      const supabase = await createAuthClient();
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    } catch {
      return null;
    }
  }

  return {
    id: "jag",
    getCurrentUserId: currentUserId,
    async getCurrentOrganizationId() {
      return input?.organizationId ?? null;
    },
    async getCurrentApplicationId() {
      return applicationId;
    },
    async getRoles() {
      return [...roles];
    },
    async getPermissions() {
      return [...permissions];
    },
    async getPermissionContext() {
      return {
        userId: await currentUserId(),
        organizationId: input?.organizationId ?? null,
        applicationId,
        permissions: new Set(permissions),
      };
    },
    async getTenantContext(): Promise<AcademyTenantContext> {
      return {
        userId: await currentUserId(),
        organizationId: input?.organizationId ?? null,
        applicationId,
        roles: [...roles],
        permissions: [...permissions],
      };
    },
    async hasPermission(permission) {
      return permissions.includes(permission);
    },
  };
}
