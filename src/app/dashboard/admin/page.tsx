import { PageHeader } from "@/components/ui/PageHeader";
import { AdminHub } from "@/components/platform/admin/AdminHub";
import { requirePlatformAdministrationAccess } from "@/lib/platform/identity/page-guard";

export default async function PlatformAdministrationPage() {
  // Sprint 009 — hub entry via centralized authorization.
  const ctx = await requirePlatformAdministrationAccess();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Platform Administration"
        subtitle="Organizations, users, roles, permissions, subscriptions, audit, support, and security"
        backHref="/dashboard"
      />
      <AdminHub permissions={ctx} />
    </div>
  );
}
