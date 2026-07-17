import { redirect } from "next/navigation";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canAccessCloudConsole } from "@/lib/cloud-platform/access";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";
import type { PermissionKey } from "@/lib/platform/identity/types";

/** Cloud Console guard — AcademyOS employees with cloud.* permissions only */
export async function requireCloudPermission(permission?: PermissionKey | PermissionKey[]) {
  const ctx = await getIdentityContext();
  if (!ctx || !canAccessCloudConsole(ctx)) redirect("/dashboard");

  if (permission) {
    const keys = Array.isArray(permission) ? permission : [permission];
    const allowed = hasPermission(ctx, "cloud.admin") || hasAnyPermission(ctx, keys);
    if (!allowed) redirect("/cloud");
  }

  return ctx;
}
