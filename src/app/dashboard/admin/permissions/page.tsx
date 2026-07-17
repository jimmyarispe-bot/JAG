import { PageHeader } from "@/components/ui/PageHeader";
import { RolesPermissionsPanel } from "@/components/platform/admin/RolesPermissionsPanel";
import { getRolesWithPermissions } from "@/lib/platform/identity/queries";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function PermissionsAdminPage() {
  await requirePagePermission("roles.view");
  const { roles, permissions, rolePermissions } = await getRolesWithPermissions();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Permissions"
        subtitle="Permission catalog and role permission matrix"
        backHref="/dashboard/admin"
      />
      <RolesPermissionsPanel
        roles={roles}
        permissions={permissions}
        rolePermissions={rolePermissions}
      />
    </div>
  );
}
