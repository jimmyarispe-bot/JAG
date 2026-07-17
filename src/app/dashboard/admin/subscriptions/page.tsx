import { PageHeader } from "@/components/ui/PageHeader";
import { AdminSectionPlaceholder } from "@/components/platform/admin/AdminSectionPlaceholder";
import { requireCatalogAccess } from "@/lib/platform/identity/page-guard";

export default async function AdminSubscriptionsPage() {
  // Sprint 009 — Platform Administration (centralized authorization).
  await requireCatalogAccess("SYSTEM_ADMIN_ACCESS");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Subscriptions"
        subtitle="Commercial subscriptions, plans, and renewals"
        backHref="/dashboard/admin"
      />
      <AdminSectionPlaceholder
        title="Subscription management"
        description="Review plans, renewals, and commercial entitlements for organizations."
        relatedHref="/cloud/subscriptions"
        relatedLabel="Open Cloud Subscriptions"
      />
    </div>
  );
}
