import { UsersAccessPanel } from "@/components/platform/admin/UsersAccessPanel";
import { getAdminUsersDirectory } from "@/lib/platform/identity/queries";
import { getOrganizationHierarchy } from "@/lib/platform/identity/org";
import { listOrganizations } from "@/lib/platform/identity/organizations";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { hasIdentityPermission } from "@/lib/platform/identity/context";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";

export default async function UsersAdminPage() {
  const ctx = await requirePagePermission("users.view");
  const [users, hierarchy, organizations] = await Promise.all([
    getAdminUsersDirectory(),
    getOrganizationHierarchy(),
    listOrganizations(),
  ]);

  const defaultOrganizationId =
    hierarchy.organization?.id ??
    (await resolvePrimaryOrganizationId(ctx.id)) ??
    organizations[0]?.id ??
    null;

  const isFounder = ctx.isFounder || ctx.roles.includes("FOUNDER");
  // Founder catalog grants users.manage; keep an explicit fallback so onboarding
  // controls never disappear if the permission snapshot is incomplete.
  const canManage =
    hasIdentityPermission(ctx, "users.manage") || isFounder;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <UsersAccessPanel
        users={users}
        schools={(hierarchy.schools ?? []).map((s) => ({ id: s.id, name: s.name }))}
        organizations={organizations.map((o) => ({ id: o.id, name: o.name }))}
        departments={(hierarchy.departments ?? []).map((d) => ({
          id: d.id,
          name: d.name,
        }))}
        canManage={canManage}
        canImpersonate={hasIdentityPermission(ctx, "impersonate.users") || isFounder}
        isFounder={isFounder}
        defaultOrganizationId={defaultOrganizationId}
      />
    </div>
  );
}
