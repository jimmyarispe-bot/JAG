import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireCloudPermission } from "@/lib/cloud-platform/page-guard";
import { getReleases } from "@/lib/cloud-platform/releases";
import { CloudShell } from "@/components/cloud-platform/CloudNav";
import { CloudTable } from "@/components/cloud-platform/CloudPanels";
import { createReleaseAction } from "@/lib/cloud-platform/actions";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export default async function CloudReleasesPage() {
  await requireCloudPermission(["cloud.admin", "cloud.engineering"]);
  const supabase = await createAuthClient();
  const releases = await getReleases(supabase);

  return (
    <CloudShell title="Release Management" subtitle="Releases, hotfixes, rollback history, beta, and pilot customers">
      <ExperienceForm
          action={createReleaseAction}
          verb="custom"
          labels={{ idle: "Plan release" }}
          progressLabel="Plan release…"
          className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4"
          buttonClassName="!bg-indigo-600 hover:!bg-indigo-700"
        >
          <input name="release_version" placeholder="v13.0.0" className="rounded-lg border px-3 py-2 text-sm" required />
          <select name="release_type" className="rounded-lg border px-3 py-2 text-sm">
          <option value="minor">Minor</option><option value="major">Major</option><option value="hotfix">Hotfix</option>
          </select>
        </ExperienceForm>
      <CloudTable rows={releases} columns={[
        { key: "release_version", label: "Version" }, { key: "release_type", label: "Type" }, { key: "status", label: "Status" },
      ]} />
    </CloudShell>
  );
}
