import { PageHeader } from "@/components/ui/PageHeader";
import { AdminSectionPlaceholder } from "@/components/platform/admin/AdminSectionPlaceholder";
import { requireCatalogAccess } from "@/lib/platform/identity/page-guard";

export default async function AdminFeatureFlagsPage() {
  // Sprint 009 — Platform Administration (centralized authorization).
  await requireCatalogAccess("SYSTEM_ADMIN_ACCESS");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Feature Flags"
        subtitle="Release flags and controlled feature rollouts"
        backHref="/dashboard/admin"
      />
      <AdminSectionPlaceholder
        title="Feature flag console"
        description="Manage release flags and staged rollouts for AcademyOS and JAG surfaces."
        relatedHref="/cloud/feature-flags"
        relatedLabel="Open Cloud Feature Flags"
      />
    </div>
  );
}
