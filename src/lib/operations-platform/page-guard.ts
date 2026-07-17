import { redirect } from "next/navigation";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canAccessOperationsCenter } from "@/lib/operations-platform/access";
import { hasAnyPermission, hasPermission } from "@/lib/platform/identity/authorization-service";
import type { PermissionKey } from "@/lib/platform/identity/types";

export async function requireOperationsPermission(permission?: PermissionKey | PermissionKey[]) {
  const ctx = await getIdentityContext();
  if (!ctx || !canAccessOperationsCenter(ctx)) redirect("/dashboard");

  if (permission) {
    const keys = Array.isArray(permission) ? permission : [permission];
    const allowed =
      hasPermission(ctx, "operations.manage") ||
      hasPermission(ctx, "cloud.admin") ||
      hasAnyPermission(ctx, keys);
    if (!allowed) redirect("/operations");
  }

  return ctx;
}
