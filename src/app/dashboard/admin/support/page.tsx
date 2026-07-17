import { PageHeader } from "@/components/ui/PageHeader";
import { AdminSectionPlaceholder } from "@/components/platform/admin/AdminSectionPlaceholder";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";

export default async function SupportAccessAdminPage() {
  await requirePagePermission(["impersonate.users", "security.view"]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Support Access"
        subtitle="Impersonation and support-mode access controls"
        backHref="/dashboard/admin"
      />
      <AdminSectionPlaceholder
        title="Support & impersonation"
        description="Start support-mode access from Users, or review impersonation history in Security."
        relatedHref="/dashboard/admin/users"
        relatedLabel="Open Users"
      />
      <AdminSectionPlaceholder
        title="Security audit"
        description="Review impersonation sessions and sensitive access events."
        relatedHref="/dashboard/admin/security"
        relatedLabel="Open Security"
      />
    </div>
  );
}