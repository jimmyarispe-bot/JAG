import { UsersAccessView } from "./UsersAccessView";
import { getAdminUsersDirectory } from "@/lib/platform/identity/queries";
import { getOrganizationHierarchy } from "@/lib/platform/identity/org";
import { listOrganizations } from "@/lib/platform/identity/organizations";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { hasIdentityPermission } from "@/lib/platform/identity/context";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";

/** Never statically cache this admin route — stale RSC payloads showed the legacy assignments UI. */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * /dashboard/admin/users — Users & Access (onboarding toolbar + directory).
 * UI lives in ./UsersAccessView (colocated). Legacy UsersAssignmentsPanel removed.
 */
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
  const canManage =
    hasIdentityPermission(ctx, "users.manage") || isFounder;

  return (
    <div
      className="mx-auto max-w-7xl space-y-6"
      data-users-route="access-v2"
    >
      {/* Server-rendered marker — visible even if a stale client chunk fails to hydrate. */}
      <p className="sr-only" data-testid="users-access-route-marker">
        Users Access onboarding workspace
      </p>
      <UsersAccessView
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
