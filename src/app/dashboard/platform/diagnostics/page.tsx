import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import {
  collectRegistryAuditReport,
  getStaticPlatformServiceHealth,
  probePlatformServiceTables,
} from "@/lib/platform/diagnostics";
import { getModuleMarketplace } from "@/lib/configuration/modules";
import { PlatformDiagnosticsView } from "@/components/platform/diagnostics/PlatformDiagnosticsView";
import { createAuthClient } from "@/lib/supabase/server-auth";

export default async function PlatformDiagnosticsPage() {
  await requirePagePermission(["configuration.admin", "configuration.manage", "certification.admin"]);

  const supabase = await createAuthClient();
  const organizationId = await getPrimaryOrganizationId(supabase);

  const [report, tableHealth, installedModules] = await Promise.all([
    Promise.resolve(collectRegistryAuditReport()),
    probePlatformServiceTables(supabase),
    organizationId
      ? getModuleMarketplace(supabase, organizationId)
      : Promise.resolve([]),
  ]);

  const serviceHealth = [...getStaticPlatformServiceHealth(), ...tableHealth];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PlatformDiagnosticsView
        report={report}
        serviceHealth={serviceHealth}
        installedModules={installedModules}
      />
    </div>
  );
}
