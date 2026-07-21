import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/integration-hub/context";
import { getBackups, getRecoveryDrills } from "@/lib/integration-hub/disaster-recovery";
import { IntHubShell } from "@/components/integration-hub/IntHubNav";
import { IntHubTable } from "@/components/integration-hub/IntHubPanels";
import { IntHubVoidButton } from "@/components/integration-hub/IntHubMutationControls";
import { createBackupAction, runRecoveryDrillAction } from "@/lib/integration-hub/actions";

export default async function DisasterRecoveryPage() {
  await requirePagePermission(["integration.admin", "integration.security"]);
  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  const [backups, drills] = await Promise.all([
    orgId ? getBackups(supabase, orgId) : [],
    orgId ? getRecoveryDrills(supabase, orgId) : [],
  ]);

  return (
    <IntHubShell title="Disaster Recovery Center" subtitle="Full tenant backup, point-in-time recovery, sandbox restore, clone organization, regional replication, recovery drills">
      <div className="flex flex-wrap gap-3">
        <IntHubVoidButton
          action={createBackupAction}
          verb="run"
          labels={{ idle: "Full tenant backup", loading: "Backing up…", success: "✓ Started" }}
          progressLabel="Creating tenant backup…"
          successToast="✓ Backup started."
          errorToast="Unable to start backup."
          className="!bg-indigo-600 hover:!bg-indigo-700"
        />
        <IntHubVoidButton
          action={runRecoveryDrillAction}
          verb="run"
          labels={{ idle: "Run recovery drill", loading: "Running…", success: "✓ Complete" }}
          progressLabel="Running recovery drill…"
          successToast="✓ Recovery drill complete."
          errorToast="Unable to run drill."
          className="!border !border-slate-200 !bg-white !text-slate-700 hover:!bg-slate-50"
        />
      </div>
      <section>
        <h2 className="mb-2 font-semibold">Backups</h2>
        <IntHubTable rows={backups} columns={[
          { key: "backup_type", label: "Type" }, { key: "status", label: "Status" },
          { key: "storage_path", label: "Path" }, { key: "verified_at", label: "Verified" }, { key: "created_at", label: "Created" },
        ]} />
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Recovery Drills</h2>
        <IntHubTable rows={drills} columns={[
          { key: "drill_type", label: "Drill" }, { key: "status", label: "Status" },
          { key: "completed_at", label: "Completed" }, { key: "created_at", label: "Scheduled" },
        ]} />
      </section>
    </IntHubShell>
  );
}
