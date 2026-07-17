import { PageHeader } from "@/components/ui/PageHeader";
import { AdminSectionPlaceholder } from "@/components/platform/admin/AdminSectionPlaceholder";
import { requireCatalogAccess } from "@/lib/platform/identity/page-guard";

export default async function ApiKeysAdminPage() {
  await requireCatalogAccess("SYSTEM_ADMIN_ACCESS");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="API Keys"
        subtitle="API credentials, scoped tokens, and developer keys"
        backHref="/dashboard/admin"
      />
      <AdminSectionPlaceholder
        title="API key management"
        description="Manage platform API keys and scoped developer credentials for integrations."
        relatedHref="/dashboard/integrations/developer"
        relatedLabel="Open Integration Developer Portal"
      />
    </div>
  );
}
