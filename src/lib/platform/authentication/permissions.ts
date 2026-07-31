/**
 * Permission loading for authenticated users — re-exports identity authorization
 * so applications can import auth + permissions from one platform surface.
 */

export {
  buildAuthzSnapshot,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@/lib/platform/identity/authorization-service";

export { loadUserRoleRows } from "@/lib/platform/identity/permissions";
export { requirePermission } from "@/lib/platform/identity/permissions";
