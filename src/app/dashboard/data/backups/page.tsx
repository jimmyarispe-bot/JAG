import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { getPrimaryOrganizationId } from "@/lib/enterprise-data/context";
import { listBackups } from "@/lib/enterprise-data/backup-engine";
import { EdpShell } from "@/components/enterprise-data/EdpNav";
import { HistoryTable } from "@/components/enterprise-data/EdpPanels";
import { createBackupAction, restoreBackupAction } from "@/lib/enterprise-data/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";
import { IntHubIdButton } from "@/components/integration-hub/IntHubMutationControls";

export default async function DataBackupsPage() {
  await requirePagePermission(["data.export", "data.admin"]);

  const supabase = await createAuthClient();
  const orgId = await getPrimaryOrganizationId(supabase);
  const backups = orgId ? await listBackups(supabase, orgId) : [];

  return (
    <EdpShell title="Backup & Restore" subtitle="Full organization backups, school backups, configuration snapshots, and point-in-time restore">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <ExperienceForm
          action={createBackupAction}
          verb="create"
          labels={{ idle: "Create backup" }}
          progressLabel="Create backup…"
          className="flex flex-wrap items-end gap-4"
        >
          <label className="block text-sm">
          Backup type
          <select name="backup_type" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2">
          <option value="full">Full organization</option>
          <option value="school">School</option>
          <option value="configuration">Configuration</option>
          <option value="database_snapshot">Database snapshot</option>
          </select>
          </label>
        </ExperienceForm>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Backup history</h2>
        <HistoryTable
          rows={backups}
          columns={[
            { key: "backup_type", label: "Type" },
            { key: "status", label: "Status" },
            { key: "backup_size_bytes", label: "Size (bytes)" },
            { key: "created_at", label: "Created" },
          ]}
        />
        {backups.filter((b) => b.status === "completed").map((b) => (
          <span key={b.id} className="mt-2 mr-2 inline-block">
            <IntHubIdButton
              action={restoreBackupAction}
              idField="backup_id"
              idValue={b.id}
              verb="run"
              labels={{
                idle: `Restore ${String(b.backup_type)}`,
                loading: "Restoring…",
                success: "✓ Restored",
              }}
              progressLabel="Restoring backup…"
              successToast="✓ Backup restored."
              errorToast="Unable to restore backup."
              variant="secondary"
              size="sm"
            />
          </span>
        ))}
      </section>
    </EdpShell>
  );
}
