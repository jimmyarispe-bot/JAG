import { PageHeader } from "@/components/ui/PageHeader";
import { SecurityDashboardPanel } from "@/components/platform/admin/SecurityDashboardPanel";
import { getAdminDashboardData } from "@/lib/platform/identity/queries";
import { requireCatalogAccess } from "@/lib/platform/identity/page-guard";

export default async function AuditLogAdminPage() {
  await requireCatalogAccess("AUDIT_ACCESS");
  const { securityStats, securityEvents, impersonationHistory } = await getAdminDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Security events, permission changes, and access history"
        backHref="/dashboard/admin"
      />
      <SecurityDashboardPanel
        stats={securityStats}
        events={securityEvents}
        impersonationHistory={impersonationHistory}
      />
    </div>
  );
}
